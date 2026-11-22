/**
 * API middleware for request validation and security.
 * 
 * @module middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidHeaderValue } from "./security";

/**
 * Security headers configuration.
 * Implements defense-in-depth with multiple security layers.
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Deny embedding in frames (clickjacking protection)
  "X-Frame-Options": "DENY",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Restrict browser features
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Force HTTPS (production only)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
} as const;

/**
 * Validates request headers for security issues.
 * 
 * @param {NextRequest} req - Incoming request
 * @returns {{ valid: boolean; error?: string }} Validation result
 */
export function validateRequestHeaders(req: NextRequest): { valid: boolean; error?: string } {
  // Check Content-Type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      return { valid: false, error: "Invalid Content-Type" };
    }
  }

  // Validate User-Agent presence (basic bot detection)
  // Only warn in development/test, don't block
  const userAgent = req.headers.get("user-agent");
  if ((!userAgent || userAgent.length < 10) && process.env.NODE_ENV !== "test") {
    console.warn("Suspicious request without proper User-Agent");
  }

  // Check for header injection attempts
  for (const [, value] of req.headers.entries()) {
    if (!isValidHeaderValue(value)) {
      return { valid: false, error: "Invalid header value detected" };
    }
  }

  return { valid: true };
}

/**
 * Applies security headers to response.
 * 
 * @param {NextResponse} response - Response to enhance
 * @param {Record<string, string>} additionalHeaders - Optional extra headers
 * @returns {NextResponse} Response with security headers
 */
export function withSecurityHeaders(
  response: NextResponse,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  Object.entries({ ...SECURITY_HEADERS, ...additionalHeaders }).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  return response;
}

/**
 * API versioning header constant.
 * Include in all API responses for version tracking.
 */
export const API_VERSION = "1.0.0";

/**
 * Creates a standardized error response with security headers.
 * 
 * @param {string} message - Error message (safe for client display)
 * @param {number} status - HTTP status code
 * @param {Record<string, string>} headers - Optional additional headers
 * @returns {NextResponse} Error response with security headers
 */
export function errorResponse(
  message: string,
  status: number,
  headers: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
  return withSecurityHeaders(response);
}

/**
 * Creates a standardized success response with security headers.
 * 
 * @param {unknown} data - Response data
 * @param {Record<string, string>} headers - Optional additional headers
 * @returns {NextResponse} Success response with security headers
 */
export function successResponse(
  data: unknown,
  headers: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(
    data,
    { headers: { "Cache-Control": "no-store", ...headers } }
  );
  return withSecurityHeaders(response);
}
