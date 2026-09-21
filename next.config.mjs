/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Default Next.js only serves images at quality 75. Product photos need to
    // look sharp when zoomed on the detail page, so allow higher-quality tiers.
    qualities: [75, 85, 90, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // How long the optimizer's own output (what browsers actually receive
    // for every <Image>, i.e. almost every photo on the site) stays cached
    // before it's worth re-checking the source. Default is 60s, which means
    // a repeat visitor mid-session re-fetches product/category photos they
    // already downloaded minutes earlier. A day is long enough that a
    // returning visitor's browser serves these straight from disk cache,
    // short enough that an admin photo edit is never stale for long.
    minimumCacheTTL: 86400,
  },
  experimental: {
    serverActions: {
      // Admin product-photo uploads (actions.ts) need room for real camera/
      // supplier photos (often 5-15MB) before sharp downsizes them.
      bodySizeLimit: "15mb",
      // The admin panel is served from its own domain (see src/proxy.ts);
      // allow its form/server-action posts when a reverse proxy rewrites Host.
      allowedOrigins: ["sabtadxb.org", "www.sabtadxb.org"],
    },
  },
  async headers() {
    // The hero video/poster and the brand/team/catalog assets are served
    // straight out of /public — they bypass the next/image optimizer above
    // entirely (a <video> source, a CSS background-image, plain <img>/<link>
    // icon references), so without an explicit header a returning visitor's
    // browser has to at least re-validate them over the network every time.
    // These are all effectively static (manually replaced on deploy, not
    // through any in-app editing flow), so a week of "don't even ask, just
    // use the cached copy" is safe, with stale-while-revalidate as a
    // month-long safety net in case one does change.
    const longCache = {
      key: "Cache-Control",
      value: "public, max-age=604800, stale-while-revalidate=2592000",
    };
    return [
      { source: "/hero/:path*", headers: [longCache] },
      { source: "/brand/:path*", headers: [longCache] },
      { source: "/team/:path*", headers: [longCache] },
      { source: "/catalog/:path*", headers: [longCache] },
    ];
  },
};

export default nextConfig;
