/** @type {import('next').NextConfig} */
const localApiProxy = !process.env.VERCEL && !process.env.DATABASE_URL
    ? (process.env.LOCAL_API_PROXY || '').replace(/\/+$/, '') : '';
if (localApiProxy && !/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(localApiProxy)) {
    throw new Error('LOCAL_API_PROXY must point to the local loopback mock');
}

const aiOrigin = (process.env.AI_SERVICE_URL || '').replace(/\/+$/, '');
if (aiOrigin && aiOrigin !== 'https://nutrivn-main.vercel.app') {
    throw new Error('AI_SERVICE_URL must be the approved NutriVN AI project origin');
}

const nextConfig = {
    // Server rendering, Node route handlers and server actions: no static export.
    pageExtensions: ['runtime.js', 'jsx', 'js', 'ts', 'tsx'],
    env: { NEXT_PUBLIC_NUTRIVN_RUNTIME_READS: '1', NEXT_PUBLIC_NUTRIVN_MOCK_API: localApiProxy ? '1' : '0' },
    async rewrites() {
        if (localApiProxy) {
            return { beforeFiles: [
                { source: '/api/next-diary', destination: localApiProxy + '/api/diary' },
                ...['email-auth', 'social-auth', 'diary', 'health', 'predict'].map(name => ({
                    source: '/api/' + name, destination: localApiProxy + '/api/' + name
                }))
            ], afterFiles: [], fallback: [] };
        }
        return [];
    },
    images: { unoptimized: true },
};
export default nextConfig;
