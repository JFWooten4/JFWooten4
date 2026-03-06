import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

type RedirectEntry = {
  key: string;
  href: string;
};

export default function InfoPage(): ReactNode {
  const [entries, setEntries] = useState<RedirectEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/404.html', {cache: 'no-store'})
      .then((response) => response.text())
      .then((html) => {
        const match = html.match(/<script id="all-redirects">([\s\S]*?)<\/script>/);
        if (!match) {
          return;
        }

        const sandbox = {LINKS: {} as Record<string, string>};
        try {
          new Function('window', match[1])(sandbox);
        } catch {
          return;
        }

        const next = Object.keys(sandbox.LINKS || {})
          .filter((key) => Boolean(sandbox.LINKS[key]))
          .map((key) => ({key, href: sandbox.LINKS[key]}))
          .sort((a, b) => a.key.localeCompare(b.key));

        setEntries(next);
      })
      .catch(() => {
        setEntries([]);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return entries;
    }
    return entries.filter(
      (item) =>
        item.key.toLowerCase().includes(q) || item.href.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <Layout title="Info Index" description="Index of short-link redirects">
      <main className="container margin-vert--lg">
        <Heading as="h1">Info Index</Heading>
        <p>Search all short-link redirects and click any key to test it.</p>
        <div className="margin-bottom--md">
          <input
            type="text"
            placeholder="Filter by key or destination..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{
              width: '100%',
              maxWidth: 560,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--ifm-color-emphasis-300)',
            }}
          />
        </div>
        <div className="margin-bottom--sm">
          Showing {filtered.length} links
          {' · '}
          <Link to="/search">Open classic search</Link>
        </div>
        <div>
          {filtered.map((item) => (
            <div key={item.key} className="margin-bottom--md">
              <a
                href={`https://wooten.link/${encodeURIComponent(item.key)}`}
                target="_blank"
                rel="noopener noreferrer">
                wooten.link/{item.key}
              </a>
              <div style={{fontSize: '.9rem', opacity: 0.85, wordBreak: 'break-word'}}>
                {item.href}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <p>No links match this filter.</p> : null}
        </div>
      </main>
    </Layout>
  );
}
