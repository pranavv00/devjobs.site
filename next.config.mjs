const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  },
];

const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    // Preserve shared searches created by the former homepage explorer.
    return ['q', 'location', 'experience', 'type', 'days', 'salary', 'source', 'sort'].map(
      (key) => ({
        source: '/',
        has: [{ type: 'query', key }],
        destination: '/jobs',
        permanent: true,
      }),
    );
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default config;
