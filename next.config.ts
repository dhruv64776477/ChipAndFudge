import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow local network IP access for testing from mobile devices
  allowedDevOrigins: ['10.27.35.164', 'localhost', '127.0.0.1'],
};

export default nextConfig;
