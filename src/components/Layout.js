import Head from 'next/head';

export default function Layout({ children, title, description }) {
  const defaultTitle = 'Scratchユーザー情報表示';
  const defaultDescription = 'Scratchユーザー情報と公開プロジェクトをすばやく確認できるツールです。';
  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <link rel="icon" href="/icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="description" content={description || defaultDescription} />
        <link rel="preconnect" href="https://scratch.mit.edu" crossOrigin="" />
        <link rel="preconnect" href="https://cdn2.scratch.mit.edu" crossOrigin="" />
        <link rel="dns-prefetch" href="https://scratch.mit.edu" />
        <link rel="dns-prefetch" href="https://cdn2.scratch.mit.edu" />
      </Head>
      {children}
    </>
  );
}
