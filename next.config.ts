import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // GitHub's generated social image, used as the card preview for repos
      // without a live demo (see Project.previewUrl in lib/projects.ts).
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com",
        pathname: "/1/**",
      },
    ],
  },
};

export default nextConfig;
