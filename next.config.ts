import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"], // Permite imágenes desde Cloudinary
  },

  async headers() {
    return [
      {
        source: "/(.*)", // Aplica a todas las rutas
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:3000 https://driving-school-mocha.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
