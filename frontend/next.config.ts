import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow alternative localhost domains for Turbopack in development
  allowedDevOrigins: ['localhost', '127.0.0.1', '10.252.13.107', '0.0.0.0'],
};

export default nextConfig;
