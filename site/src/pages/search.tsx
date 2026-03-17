import {useEffect} from 'react';
import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function SearchPage(): ReactNode {
  useEffect(() => {
    window.location.replace('/static/search.html');
  }, []);

  return (
    <Layout title="Link Search" description="Redirecting to link search">
      <main className="container margin-vert--xl">
        <Heading as="h1">Link Search</Heading>
        <p>Redirecting to the classic search page.</p>
      </main>
    </Layout>
  );
}
