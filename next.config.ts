import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The "Off the clock" markdown is read from disk when the home page
  // renders, so it has to travel with the server bundle.
  outputFileTracingIncludes: {
    "/": ["src/content/**/*.md"],
  },
};

export default nextConfig;
