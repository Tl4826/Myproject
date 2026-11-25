/** @type {import('next').NextConfig} */
const isStaticExport = Boolean(process.env.VERCEL || process.env.NEXT_STATIC_EXPORT);
const localApiProxy = !isStaticExport ? (process.env.LOCAL_API_PROXY || '').replace(/\/+$/, '') : '';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  ...(localApiProxy
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${localApiProxy}/api/:path*`,
            },
          ];
        },
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
