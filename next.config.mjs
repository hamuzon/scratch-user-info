const normalizeBasePath = (value) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return prefixed.replace(/\/+$/, '');
};

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath = normalizeBasePath(
  configuredBasePath || (isGitHubPagesBuild ? '/scratch-user-info' : ''),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
