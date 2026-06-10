# 📅 Morgen-Briefing

Tägliches Briefing, das um **07:30 Uhr** (Mo–Fr) auf deinem Mac erscheint.

## Was es macht

1. **Kalender**: Holt alle Termine von heute aus deinen iCloud-Kalendern (via CalDAV)
2. **E-Mails**: Listet ungelesene Nachrichten aus Apple Mail (via AppleScript)
3. **Notification**: Zeigt eine macOS Benachrichtigung mit einer Zusammenfassung

## Einrichtung

### 1. App-Specific Password erstellen

1. Gehe zu [appleid.apple.com](https://appleid.apple.com) → **Security**
2. Unter **App-Specific Passwords** klicke auf **"Generate a password"**
3. Gib als Namen z.B. "Daily Briefing" ein
4. Kopiere das generierte Passwort (z.B. `abcd-efgh-ijkl-mnop`)

### 2. .env erstellen

```bash
cd scripts/daily-briefing
cp .env.example .env
# Edit the file with your iCloud email and app-specific password
nano .env
```

Inhalt von `.env`:
```
DAILY_BRIEFING_ICLOUD_USER=deine@icloud.com
DAILY_BRIEFING_ICLOUD_PASS=abcd-efgh-ijkl-mnop
```

### 3. Berechtigungen für Apple Mail setzen

Damit das Skript E-Mails lesen kann, musst du dem Terminal/Zugriff auf Apple Mail erlauben:

1. **Systemeinstellungen → Datenschutz & Sicherheit → Vollzugriff**
2. Suche nach deinem Terminal (Terminal.app oder iTerm2) und aktiviere es
3. Falls nötig: unter **"Automation"** deine App für "Mail" aktivieren

### 4. launchd-Agent installieren

```bash
# Kopiere die plist in den LaunchAgents Ordner
cp com.daily.briefing.plist ~/Library/LaunchAgents/

# Lade den Agent (startet sofort)
launchctl load ~/Library/LaunchAgents/com.daily.briefing.plist
```

### 5. Testen

```bash
cd scripts/daily-briefing
./briefing.py
# oder mit force auch am Wochenende:
BRIEFING_FORCE=1 ./briefing.py
```

## Deaktivieren

```bash
launchctl unload ~/Library/LaunchAgents/com.daily.briefing.plist
rm ~/Library/LaunchAgents/com.daily.briefing.plist
```

## Troubleshooting

- **"No iCloud calendars found"** → Prüfe, ob dein App-Specific Password korrekt ist (appleid.apple.com)
- **"Mail nicht geöffnet"** → Das Briefing zeigt einen Hinweis, aber funktioniert weiter mit Kalendern
- **Kein Notification** → Systemeinstellungen → Mitteilungen: Stelle sicher, dass "Mitteilungen" aktiviert sind für das Terminal
- **Timeout** → iCloud CalDAV kann langsam sein. Das Skript hat 15s Timeout.

## Anpassungen

### Andere Uhrzeit?

In `com.daily.briefing.plist` die `StartHour`/`StartMinute` ändern:
```xml
<key>StartHour</key><integer>8</integer>
<key>StartMinute</key><integer>0</integer>
```

### Nur Kalender, keine E-Mails?

Das Skript kann leicht um AppleScript-Teile gekürzt werden. Schreib mich an wenn du das brauchst.
