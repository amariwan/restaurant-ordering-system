'use client';

import { useEffect, useState } from 'react';

type Props = {
  value: string | Date;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatStable(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  // Use UTC-based stable format so server and client initial render match
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

export default function LocalDate({ value }: Props) {
  const iso = typeof value === 'string' ? value : value.toISOString();

  const [display, setDisplay] = useState(() => formatStable(value));

  useEffect(() => {
    try {
      const d = new Date(iso);
      setDisplay(d.toLocaleString());
    } catch {
      setDisplay(formatStable(iso));
    }
  }, [iso]);

  return <time dateTime={iso}>{display}</time>;
}
