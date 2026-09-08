import type { NextConfig } from "next";

const cardImagesEnabled =
  process.env.CARD_IMAGES_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote";

const imgSrc = cardImagesEnabled
  ? "'self' data: https://marvelcdb.com https://es.marvelcdb.com"
  : "'self' data:";
const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline' 'wasm-unsafe-eval'"
    : "'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: cardImagesEnabled
      ? [
          {
            protocol: "https",
            hostname: "marvelcdb.com",
            pathname: "/bundles/cards/**"
          },
          {
            protocol: "https",
            hostname: "es.marvelcdb.com",
            pathname: "/bundles/cards/**"
          }
        ]
      : []
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrc}`,
      "connect-src 'self'",
      "worker-src 'self'",
      "manifest-src 'self'"
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()"
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
