import type {ReactNode} from 'react';
import {useEffect} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  useEffect(() => {
    const host = (window.location.hostname || '').toLowerCase();
    const subdomain = host.split('.')[0];
    const cleanPath = (window.location.pathname || '')
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();
    const pathKey = cleanPath.split('/')[0] || '';

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

        const redirects = sandbox.LINKS || {};
        const keysToTry: string[] = [];

        if (
          host.endsWith('wooten.link') &&
          subdomain &&
          subdomain !== 'www' &&
          subdomain !== 'wooten'
        ) {
          keysToTry.push(subdomain);
        }
        if (pathKey) {
          keysToTry.push(pathKey);
        }

        const key = keysToTry.find((k) => redirects[k]);
        if (key) {
          window.location.replace(redirects[key]);
        }
      })
      .catch(() => {
        // Keep the homepage usable even if redirect lookup fails.
      });
  }, []);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/blog">
            Read Blog Posts
          </Link>
          <a
            className="button button--secondary button--lg margin-left--sm"
            href="/info/">
            Open Info Index
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="John Wooten blog and short-link directory">
      <HomepageHeader />
      <main />
    </Layout>
  );
}
