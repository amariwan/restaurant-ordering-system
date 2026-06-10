#!/usr/bin/env python3
"""
Daily Morning Briefing for macOS
Reads today's Calendar events and unread Mail from the Mac.
Outputs formatted text + sends a notification.

Fallback modes (in order):
  1. CalDAV (icloud.com) — primary calendar source
  2. AppleScript → Shortcuts.app export (JSON file) — backup calendar source
  3. CSV import via BRIEFING_CSV=/path/to/export.csv — manual fallback
  4. Mail via AppleScript — primary mail source
  5. Fallback text file via BRIEFING_MAIL=/path/to/unread.txt — manual fallback

Setup:
  1. Create an App-Specific Password at appleid.apple.com → Security
  2. Set environment vars (or create .env in this directory):
       DAILY_BRIEFING_ICLOUD_USER=your@icloud.com
       DAILY_BRIEFING_ICLOUD_PASS=app-specific-password
     OR set:
       BRIEFING_FORCE=1            — force run on weekends
       BRIEFING_MODE=dav|calendar|csv|manual  — override data source
       BRIEFING_CSV=/path/to.csv   — CSV import for calendar
       BRIEFING_MAIL=/path/to.txt  — text file with "SUBJECT | SENDER" lines
     OR create a Shortcut in Shortcuts.app called "DailyBriefingExport":
       → Outputs JSON to ~/Library/Mobile Documents/iCloud~md~shortcuts/Documents/briefing.json
       Then set: BRIEFING_SHORTCUT_EXPORT=1
  3. Install launchd agent (see README.md)
"""

import os
import sys
import subprocess
import urllib.request
import urllib.error
from datetime import datetime, timedelta, date
from pathlib import Path


# --- Config ---
CALDAV_URL = "https://caldav.icloud.com/"

# Try loading .env from same directory first
_env_path = Path(__file__).parent / ".env"
_ICLOUD_USER = ""
_ICLOUD_PASS = ""

if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k == "DAILY_BRIEFING_ICLOUD_USER":
            _ICLOUD_USER = v
        elif k == "DAILY_BRIEFING_ICLOUD_PASS":
            _ICLOUD_PASS = v

# Environment vars override .env file
ICLOUD_USER = os.environ.get("DAILY_BRIEFING_ICLOUD_USER") or _ICLOUD_USER
ICLOUD_PASS = os.environ.get("DAILY_BRIEFING_ICLOUD_PASS") or _ICLOUD_PASS
BRIEFING_FORCE = os.environ.get("BRIEFING_FORCE", "0").lower() in ("1", "true", "yes")
BRIEFING_MODE = os.environ.get("BRIEFING_MODE", "auto")  # auto|dav|calendar|csv|manual
BRIEFING_CSV = os.environ.get("BRIEFING_CSV")
BRIEFING_MAIL = os.environ.get("BRIEFING_MAIL")
BRIEFING_SHORTCUT_EXPORT = os.environ.get("BRIEFING_SHORTCUT_EXPORT", "0").lower() in ("1", "true", "yes")


# ==================== CALENDAR SOURCES ====================


def _caldav_request(xml_body, url):
    """Send a CalDAV request with Basic Auth."""
    import base64
    if not ICLOUD_USER or not ICLOUD_PASS:
        return None

    req = urllib.request.Request(
        url,
        data=xml_body.encode("utf-8"),
        headers={"Depth": "1", "Content-Type": "text/xml; charset=utf-8"},
    )
    credentials = f"{ICLOUD_USER}:{ICLOUD_PASS}"
    b64 = base64.b64encode(credentials.encode()).decode()
    req.add_header("Authorization", f"Basic {b64}")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print(f"WARN: CalDAV auth failed (HTTP 401). Check your App-Specific Password.", file=sys.stderr)
        else:
            print(f"WARN: CalDAV HTTP {e.code} for {url}", file=sys.stderr)
        return ""


def _discover_principal():
    """Find the CalDAV principal URL via PROPFIND."""
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
    <D:propfind xmlns:D="DAV:">
      <D:current-user-principal/>
    </D:propfind>'''
    resp = _caldav_request(xml, CALDAV_URL)
    if not resp:
        return None
    try:
        import xml.etree.ElementTree as ET
        root = ET.fromstring(resp)
        for href in root.findall(".//d:href"):
            text = href.text or ""
            if "principals" in text and ICLOUD_USER.lower() in text.lower():
                return text.strip("/")
    except Exception:
        pass
    return None


def _discover_calendars(principal_url):
    """List all calendars under the principal."""
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
    <D:propfind xmlns:D="DAV:">
      <D:resourcetype/>
      <D:displayname/>
    </D:propfind>'''
    url = (principal_url or "").rstrip("/") + "/"
    resp = _caldav_request(xml, url)
    if not resp:
        return []

    import xml.etree.ElementTree as ET
    calendars = []
    try:
        root = ET.fromstring(resp)
        for response in root.findall(".//d:response"):
            href_elem = response.find(".//d:href")
            propstat = response.find(".//d:propstat")
            if href_elem is None or propstat is None:
                continue

            href = (href_elem.text or "").strip("/")
            if "principals" in href or "/calendar-home-set/" in href:
                continue

            prop = propstat.find("d:prop")
            if prop is None:
                continue

            res_type = prop.find("{urn:ietf:params:xml:ns:caldav}calendar")
            if res_type is not None:
                name_elem = prop.find("{DAV:}displayname")
                display_name = name_elem.text.strip() if name_elem is not None and name_elem.text else href.split("/")[-1]
                calendars.append((href, display_name))
    except Exception as e:
        print(f"WARN: Calendar discovery error: {e}", file=sys.stderr)

    return calendars


def _extract_vcal_field(text, key):
    """Extract field value from VCALENDAR text. Handles params like DTSTART;VALUE=DATE."""
    for line in text.splitlines():
        upper = line.upper()
        if upper.startswith(key + ":") or upper.startswith(key + ";"):
            val = line.split(":", 1)[-1].strip()
            val = val.split(";")[0]
            return val
    return None


def _parse_ical_date(date_str):
    """Parse YYYYMMDDTHHMMSSZ or YYYYMMDD to datetime."""
    if not date_str:
        return None
    try:
        if "T" in date_str:
            base = date_str[:15]
            return datetime.strptime(base, "%Y%m%dT%H%M%S")
        return datetime.strptime(date_str[:8], "%Y%m%d").replace(hour=9)
    except ValueError:
        return None


def _fetch_events_caldav():
    """Fetch today's events from all iCloud calendars via CalDAV."""
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now + timedelta(days=1)

    principal_url = _discover_principal()
    if not principal_url:
        return []
    calendars = _discover_calendars(principal_url)
    if not calendars:
        return []

    import xml.etree.ElementTree as ET
    xml_body = f'''<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop xmlns:D="DAV:">
    <D:getcontenttype/>
    <C:expand start="{today_start.strftime('%Y%m%dT000000Z')}"
              end="{today_end.strftime('%Y%m%dT000000Z')}"/>
  </D:prop>
  <C:filter>
    <C:comp-filter>
      <C:comp-name val="VEVENT"/>
      <C:time-range start="{today_start.strftime('%Y%m%dT000000Z')}"
                    end="{(today_end - timedelta(seconds=1)).strftime('%Y%m%dT000000Z')}"/>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>'''

    all_events = []
    for cal_href, cal_name in calendars:
        url = CALDAV_URL.rstrip("/") + "/" + cal_href.lstrip("/")
        resp = _caldav_request(xml_body, url)
        if not resp or not resp.strip():
            continue

        try:
            root = ET.fromstring(resp)
            for response in root.findall(".//d:response"):
                href_elem = response.find(".//d:href")
                propstat = response.find(".//d:propstat")
                if href_elem is None or propstat is None:
                    continue

                prop = propstat.find("d:prop")
                if prop is None:
                    continue

                comp = prop.find("{urn:ietf:params:xml:ns:caldav}comp")
                if comp is None:
                    continue

                event_el = comp.find("{urn:ietf:params:xml:ns:caldav}event")
                if event_el is None:
                    continue

                vcal_text = event_el.text or ""
                summary = _extract_vcal_field(vcal_text, "SUMMARY")
                dt_start_str = _extract_vcal_field(vcal_text, "DTSTART")
                dt_end_str = _extract_vcal_field(vcal_text, "DTEND")
                location = _extract_vcal_field(vcal_text, "LOCATION")
                status = _extract_vcal_field(vcal_text, "STATUS")

                start_dt = _parse_ical_date(dt_start_str) if dt_start_str else None
                end_dt = _parse_ical_date(dt_end_str) if dt_end_str else None

                all_events.append({
                    "summary": summary or "(Kein Titel)",
                    "start": start_dt,
                    "end": end_dt,
                    "location": location,
                    "status": status,
                    "calendar": cal_name,
                    "source": "CalDAV",
                })
        except ET.ParseError as e:
            print(f"WARN: Parse error in calendar '{cal_name}': {e}", file=sys.stderr)

    all_events.sort(key=lambda e: e["start"] or datetime.max)
    return all_events


def _fetch_events_shortcut():
    """Fetch events from Shortcut export (JSON)."""
    shortcut_json = Path.home() / "Library" / "Mobile Documents" / "iCloud~md~shortcuts" / "Documents" / "briefing.json"

    if not BRIEFING_SHORTCUT_EXPORT:
        return None, "BRIEFING_SHORTCUT_EXPORT=1 not set"

    if not shortcut_json.exists():
        return None, f"Shortcut export not found at {shortcut_json}"

    import json
    try:
        data = json.loads(shortcut_json.read_text())
        events = []
        for item in data.get("events", data if isinstance(data, list) else []):
            summary = item.get("summary", item.get("title", "N/A"))
            start_str = item.get("start", item.get("date", ""))
            end_str = item.get("end", "")

            # Parse flexible date formats
            def parse_flex(s):
                if not s:
                    return None
                for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
                    try:
                        dt = datetime.strptime(s, fmt)
                        return dt if "T" in s or ":" in s else dt.replace(hour=9)
                    except ValueError:
                        continue
                return None

            events.append({
                "summary": summary,
                "start": parse_flex(start_str),
                "end": parse_flex(end_str),
                "location": item.get("location", ""),
                "status": item.get("status", ""),
                "calendar": item.get("calendar", item.get("source", "Shortcuts")),
                "source": "Shortcut",
            })
        return events, None
    except (json.JSONDecodeError, KeyError) as e:
        return None, f"JSON parse error: {e}"


def _fetch_events_csv():
    """Parse CSV with columns: Date, Time, EndTime, Summary, Location, Calendar."""
    if not BRIEFING_CSV or not Path(BRIEFING_CSV).exists():
        return None, "CSV path not set or file missing"

    import csv
    events = []
    try:
        with open(BRIEFING_CSV, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                summary = row.get("Summary", row.get("summary", "N/A"))
                date_str = row.get("Date", row.get("date", ""))
                time_str = row.get("Time", row.get("time", ""))
                end_str = row.get("EndTime", row.get("endTime", ""))

                dt = None
                if date_str:
                    try:
                        base = datetime.strptime(date_str, "%Y-%m-%d")
                        if time_str and ":" in time_str:
                            h, m = map(int, time_str.split(":"))
                            dt = base.replace(hour=h, minute=m)
                        else:
                            dt = base.replace(hour=9)
                    except ValueError:
                        pass

                end_dt = None
                if date_str and end_str and ":" in end_str:
                    try:
                        base = datetime.strptime(date_str, "%Y-%m-%d")
                        h, m = map(int, end_str.split(":"))
                        end_dt = base.replace(hour=h, minute=m)
                    except ValueError:
                        pass

                events.append({
                    "summary": summary,
                    "start": dt,
                    "end": end_dt,
                    "location": row.get("Location", ""),
                    "status": "",
                    "calendar": row.get("Calendar", row.get("calendar", "")),
                    "source": "CSV",
                })
        return events, None
    except Exception as e:
        return None, f"CSV error: {e}"


def _fetch_events_manual():
    """Parse a text file with format: 'TIME SUMMARY | LOCATION' per line."""
    # Use BRIEFING_CSV as manual file
    if not BRIEFING_CSV or not Path(BRIEFING_CSV).exists():
        return None, "Manual file not set (use BRIEFING_CSV)"

    events = []
    try:
        for line in Path(BRIEFING_CSV).read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Format: HH:MM Summary text | Optional notes
            parts = [p.strip() for p in line.split("|")]
            summary = parts[-1] if parts else "N/A"
            dt = None
            if ":" in parts[0] if parts else "":
                try:
                    h, m = map(int, parts[0].split(":"))
                    dt = datetime.now().replace(hour=h, minute=m)
                except ValueError:
                    pass

            events.append({
                "summary": summary,
                "start": dt,
                "end": None,
                "location": parts[1] if len(parts) > 1 else "",
                "status": "",
                "calendar": "Manuell",
                "source": "Manual",
            })
        return events, None
    except Exception as e:
        return None, f"Manual parse error: {e}"


def get_events():
    """Get today's events using configured or auto-detected source."""
    # Check mode priority
    if BRIEFING_MODE == "csv":
        events, err = _fetch_events_csv()
        return events, err

    if BRIEFING_MODE == "manual":
        events, err = _fetch_events_manual()
        return events, err

    if BRIEFING_SHORTCUT_EXPORT:
        events, err = _fetch_events_shortcut()
        if events is not None and events:
            return events, None  # Success

    # Try CalDAV
    events, _ = _fetch_events_caldav()
    if events:
        return events, None

    return events, "CalDAV failed — no backup source found"


# ==================== MAIL SOURCES ====================


def _get_unread_mail_applescript():
    """Get unread mail via AppleScript."""
    script = '''tell application "Mail"
    set results to {}
    tell application "System Events"
        set mailProcessExists to (exists (processes where name is "Mail"))
    end tell
    if not mailProcessExists then return "NOTRUNNING"

    set allAccounts to accounts
    repeat with acct in allAccounts
        set acctName to name of acct as text
        tell acct
            set unreadMessages to messages of inbox whose read status is false
            repeat with msg in unreadMessages
                set senderAddr to address of sender of msg
                set subj to subject of msg
                if class of senderAddr is not missing value then
                    set end of results to (acctName & " | " & senderAddr & " | " & subj) as text
                else
                    set end of results to (acctName & " | " & "(unknown)" & " | " & subj) as text
                end if
            end repeat
        end tell
    end repeat
    return results
end tell'''

    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True, text=True, timeout=15
        )
        output = result.stdout.strip()

        if output == "NOTRUNNING":
            return None  # Mail not running — we know it exists but isn't open

        if not output or result.returncode != 0:
            return []

        items = []
        for item_str in output.split('\", "') :
            item_str = item_str.strip().strip('"')
            parts = [p.strip() for p in item_str.split(" | ")]
            if len(parts) >= 3:
                items.append((parts[0], parts[1], parts[2]))
        return items[:20]

    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []


def _get_unread_mail_file():
    """Get unread mail from a text file."""
    if not BRIEFING_MAIL or not Path(BRIEFING_MAIL).exists():
        return []

    items = []
    for line in Path(BRIEFING_MAIL).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2:
            items.append(("File", parts[0], parts[1]))

    return items[:20]


def get_unread_mail():
    """Get unread mail using configured or auto-detected source."""
    if BRIEFING_MODE == "mail" and BRIEFING_MAIL:
        return _get_unread_mail_file()

    # Try AppleScript first (auto mode)
    result = _get_unread_mail_applescript()
    if result is not None:  # Not Mail-not-running signal
        return result

    # Fall back to file
    return _get_unread_mail_file()


# ==================== FORMATTING ====================


def format_time(dt):
    """Format time as 'HH:MM' or all-day indicator."""
    if not dt:
        return "Ganzer Tag"
    return f"{dt.hour:02d}:{dt.minute:02d}"


def get_priority_items(events):
    """Detect priority items from events based on keywords."""
    keywords = ["deadline", "termin", "meeting", "besprechung", "check-in", "review"]
    priority = []
    for ev in events:
        lower_title = ev["summary"].lower()
        if any(kw in lower_title for kw in keywords):
            priority.append(ev)
    return priority


def format_briefing(events, unread_mail, source_info=""):
    """Generate formatted briefing text."""
    now = datetime.now()
    day_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    month_names = [None, "Januar", "Februar", "März", "April", "Mai", "Juni",
                   "Juli", "August", "September", "Oktober", "November", "Dezember"]

    day_str = f"{day_names[now.weekday()]}, {now.day:2d}. {month_names[now.month]}"

    lines = []
    lines.append("═" * 50)
    lines.append(f"  📅 {day_str}")
    lines.append("═" * 50)

    if source_info:
        lines.append(f"  Quelle: {source_info}")
    lines.append("")

    # Calendar events
    lines.append(f"🗓️ Heutige Termine ({len(events)})")
    if events:
        for ev in events:
            start = format_time(ev["start"])
            end = format_time(ev["end"])
            dur = f" {start}–{end}" if (ev["start"] and ev["end"]) else ""
            cal = f" — {ev.get('calendar', '')}" if ev.get("calendar") else ""
            loc = f" 📍 {ev['location']}" if ev.get("location") else ""
            status_note = " ⏳ (geplant)" if ev.get("status") == "TENTATIVE" else ""

            lines.append(f"  • {ev['summary']}{dur}{loc}{cal}{status_note}")
    else:
        lines.append("  Keine Termine heute — freier Tag! 🎉")
    lines.append("")

    # Unread mail
    if unread_mail is None:
        lines.append("📬 Apple Mail ist aktuell nicht geöffnet.")
        lines.append("   Tip: Öffne Mail, dann erscheint der E-Mail-Teil.")
    elif isinstance(unread_mail, list):
        if unread_mail:
            lines.append(f"📬 Ungelesene E-Mails ({len(unread_mail)})")
            for account, sender, subject in unread_mail:
                subj = subject[:70] + ("..." if len(subject) > 70 else "")
                lines.append(f"  • {subj}")
                lines.append(f"    von {sender} · [{account}]")
        else:
            lines.append("📬 Keine ungelesenen E-Mails ✅")
    else:
        lines.append(f"📬 Mail-Fehler: {unread_mail}")

    # Priority items
    priority = get_priority_items(events)
    if priority:
        lines.append("")
        lines.append("═" * 50)
        lines.append("⚡ Wichtig:")
        for ev in priority:
            start = format_time(ev["start"])
            lines.append(f"   • {ev['summary']} — {start}")

    return "\n".join(lines)


def send_notification(briefing_text):
    """Send a macOS notification with the briefing."""
    preview_lines = [l.strip() for l in briefing_text.splitlines() if l.strip()]
    body_parts = []
    for line in preview_lines:
        cleaned = line.lstrip(" ═").strip()
        if cleaned and len(cleaned) > 3:
            body_parts.append(cleaned[:60])

    body = " | ".join(body_parts[:3])
    title = "Morgen-Briefing"

    script = f'display notification "{body}" with title "{title}" subtitle "📅 heute" sound "Glass"'

    try:
        subprocess.run(["osascript", "-e", script], capture_output=True, timeout=5)
    except Exception as e:
        print(f"WARN: Notification fehlgeschlagen: {e}", file=sys.stderr)


# ==================== MAIN ====================


def main():
    now = datetime.now()

    # Force or weekend check
    if not BRIEFING_FORCE and now.weekday() >= 5:
        day_names_short = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
        print(f"Briefing: Wochenende ({day_names_short[now.weekday()]}) — nichts zu tun.", file=sys.stderr)
        return

    # Time window check (05:00 - 14:00)
    hour = now.hour
    if hour < 5 or hour > 14:
        print(f"Briefing: Außerhalb der Morgenzeit ({hour}:00). Ignoriere.", file=sys.stderr)
        return

    # Check config
    has_creds = bool(ICLOUD_USER and ICLOUD_PASS)

    # Get events
    events, event_error = get_events()
    if event_error and not has_creds:
        print(f"ERROR: Keine Events gefunden. Brauche CalDAV-Zugang (.env mit Credentials) oder BRIEFING_CSV=.", file=sys.stderr)
        sys.exit(1)

    # Get mail
    unread_mail = get_unread_mail()
    if isinstance(unread_mail, list) and not unread_mail:
        # Mail check: was it just that Mail wasn't running?
        pass

    # Determine source info
    sources = []
    if events:
        first_source = next((ev.get("source", "?") for ev in events), "?")
        sources.append(first_source)
    if BRIEFING_CSV and Path(BRIEFING_CSV).exists():
        sources.append(f"CSV:{BRIEFING_CSV}")
    if BRIEFING_SHORTCUT_EXPORT:
        sources.append("Shortcut")
    source_info = ", ".join(sources) if sources else "N/A (keine Events)"

    # Format & display
    text = format_briefing(events or [], unread_mail, source_info)
    print(text)

    # Send notification
    send_notification(text)


if __name__ == "__main__":
    main()
