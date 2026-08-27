import { NextResponse, type NextRequest } from "next/server";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function isLoopback(value: string) {
  try {
    return loopbackHosts.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Behind the platform gateway the Host header is the app's public hostname and
// the gateway authenticates every visitor, so the local-only host guard would
// reject legitimate traffic. Detected per request, never at import time.
function isBehindPlatformGateway(request: NextRequest) {
  return Boolean(
    process.env.SPIN_APP_URL?.trim() || request.headers.get("x-forwarded-host"),
  );
}

function isSameOrigin(value: string, request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    requestUrl.host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      requestUrl.host;
    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim();
    if (forwardedProtocol) requestUrl.protocol = `${forwardedProtocol}:`;
    return new URL(value).origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (!isBehindPlatformGateway(request) && !isLoopback(`http://${host}`)) {
    return NextResponse.json(
      { error: "Control Center only accepts requests from this computer." },
      { status: 403 },
    );
  }
  const origin = request.headers.get("origin");
  if (origin && !isSameOrigin(origin, request)) {
    return NextResponse.json(
      { error: "Cross-site requests are blocked." },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
