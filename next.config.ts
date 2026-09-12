import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse", "@prisma/client", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },

    /**
     * `icons.tsx` names 46 glyphs from the Phosphor barrel, and 54 files
     * import `icons.tsx` — so it is on the critical path of almost every
     * route. A production build tree-shakes that down to the 46 actually
     * used, but the dev compiler does not: it resolves the whole barrel,
     * which is the entire icon set, on the first request that touches any
     * page. This rewrites the barrel import to direct per-icon imports so
     * only what is named gets compiled.
     */
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
