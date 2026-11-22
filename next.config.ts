import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Enhanced Content Security Policy configuration.
 * 
 * Production: Strict CSP with nonce support (Next.js will inject nonces automatically)
 * Development: Relaxed for hot reload but still restrictive
 * 
 * Security improvements:
 * - Removed 'unsafe-inline' for scripts in production
 * - Added object-src and media-src restrictions
 * - Added font-src and worker-src
 * - Upgraded to strict-dynamic where supported
 */
const csp = [
  "default-src 'self'",
  // Scripts: strict in production, relaxed in dev for HMR
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'strict-dynamic'",
  // Styles: inline required for Next.js CSS-in-JS
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs for inline images
  "img-src 'self' data: blob:",
  // Fonts: self + data URIs
  "font-src 'self' data:",
  // AJAX/Websocket: only to same origin
  "connect-src 'self'",
  // Prevent all plugins
  "object-src 'none'",
  // Media elements
  "media-src 'self'",
  // Worker/Service Worker scripts
  "worker-src 'self' blob:",
  // Prevent framing (redundant with X-Frame-Options but defense-in-depth)
  "frame-ancestors 'none'",
  // Restrict base tag
  "base-uri 'self'",
  // Restrict form submissions
  "form-action 'self'",
  // Upgrade insecure requests in production
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Remove X-Powered-By header (security through obscurity)
  poweredByHeader: false,
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  // Enhanced security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enhanced Permissions Policy
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()", // Disable FLoC
              "payment=()",
              "usb=()",
              "magnetometer=()",
              "gyroscope=()",
              "accelerometer=()",
            ].join(", "),
          },
          // HSTS with preload directive
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // XSS Protection for legacy browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // API Version header for tracking
          { key: "X-API-Version", value: "1.0.0" },
        ],
      },
    ];
  },
};

export default nextConfig;