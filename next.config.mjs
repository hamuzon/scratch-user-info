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

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);


/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|js|css|woff|woff2)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
