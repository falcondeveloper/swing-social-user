import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,

    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "truecontractingsolutions.app",
            },
        ],
    },

    allowedDevOrigins: [
        "localhost",
        "127.0.0.1",
        "192.168.1.7",      // 👈 VERY IMPORTANT
    ],

    turbopack: {}, // 👈 fixes Issue #2 (explained below)
};

export default nextConfig;
