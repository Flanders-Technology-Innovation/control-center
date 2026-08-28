import "server-only";

// Behind the platform gateway request.url can carry the internal host and port,
// so Google would receive a redirect_uri it rejects (or a different one in the
// start and callback steps). Resolve the public address per request, never at
// import time, and fall back to request.url for local use.
export function googleRedirectUri(request: Request) {
  const configured = process.env.SPIN_APP_URL?.trim();
  if (configured) {
    try {
      return new URL("/api/auth/google/callback", configured).toString();
    } catch {
      // An unusable value must not break the connection flow; use the headers below.
    }
  }
  const url = new URL("/api/auth/google/callback", request.url);
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  if (forwardedProtocol) url.protocol = `${forwardedProtocol}:`;
  if (forwardedHost) url.host = forwardedHost;
  return url.toString();
}
