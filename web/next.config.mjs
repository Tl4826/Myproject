/** @type {import('next').NextConfig} */
const isStaticExport = Boolean(process.env.VERCEL || process.env.NEXT_STATIC_EXPORT);

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
