// next/image refuses a remote source whose host is not allow-listed, and unit
// tests cannot catch that (Next skips the check under NODE_ENV=test). Guard the
// one remote host the project cards use for repos without a live demo.

import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config images", () => {
  it("allows the GitHub social image host that project cards use as a fallback preview", () => {
    expect(nextConfig.images?.remotePatterns).toContainEqual(
      expect.objectContaining({
        protocol: "https",
        hostname: "opengraph.githubassets.com",
        pathname: "/1/**",
      }),
    );
  });
});
