/** @type {import('next').NextConfig} */
const runtimeReads = process.env.NUTRIVN_RUNTIME_READS === '1' && !process.env.NEXT_STATIC_EXPORT;
const isStaticExport = Boolean(process.env.NEXT_STATIC_EXPORT || (process.env.VERCEL && !runtimeReads));
const localApiProxy = !isStaticExport ? (process.env.LOCAL_API_PROXY || '').replace(/\/+$/, '') : '';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  // Runtime handlers use a distinct extension; keep existing production static export unchanged.
  ...(runtimeReads ? { pageExtensions: ['runtime.js', 'jsx', 'js', 'ts', 'tsx'] } : {}),
  env: { NEXT_PUBLIC_NUTRIVN_RUNTIME_READS: runtimeReads ? '1' : '0' },
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
