import { SpeedInsights } from '@vercel/speed-insights/next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {!isGitHubPages && <SpeedInsights />}
    </>
  );
}
