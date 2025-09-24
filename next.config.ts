import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      }
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)", // Aplica a todas las rutas
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Permite que el sitio se cargue en un iframe
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://driving-school-mocha.vercel.app https://dashboard-ds-flax.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
