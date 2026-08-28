import { NextResponse, type NextRequest } from "next/server";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function isLoopback(value: string) {
  try {
    return loopbackHosts.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function originOf(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

// Forwarding headers accumulate one value per hop; the first is the client's.
function firstHeaderValue(request: NextRequest, header: string) {
  return request.headers.get(header)?.split(",")[0].trim() || "";
}

// Behind the platform gateway the Host header is the app's public hostname and
// the gateway authenticates every visitor, so the local-only host guard would
// reject legitimate traffic. Detected per request, never at import time.
function isBehindPlatformGateway(request: NextRequest) {
  return Boolean(
    process.env.SPIN_APP_URL?.trim() || request.headers.get("x-forwarded-host"),
  );
}

// Every address this app is legitimately reached at. The request URL is not one
// of them behind the gateway: it keeps the container's internal port, which no
// browser ever sees, and overwriting its host does not drop that port. So each
// address is built from scratch and normalized through URL.origin instead.
function sameOriginAddresses(request: NextRequest) {
  const addresses = new Set<string>();
  // spin injects the app's public address; it outranks any request header.
  const publicOrigin = originOf(process.env.SPIN_APP_URL?.trim() || "");
  if (publicOrigin) addresses.add(publicOrigin);
  const requestUrl = new URL(request.url);
  const forwardedHost = firstHeaderValue(request, "x-forwarded-host");
  const forwardedProtocol = firstHeaderValue(request, "x-forwarded-proto");
  const host =
    forwardedHost || request.headers.get("host")?.trim() || requestUrl.host;
  // The gateway terminates TLS, so a forwarded request carries an https Origin
  // even though this server only ever speaks http. When the gateway names the
  // scheme, trust it; when it stays silent, accept the app's own host on either.
  const protocols = forwardedProtocol
    ? [forwardedProtocol]
    : forwardedHost
      ? ["https", "http"]
      : [requestUrl.protocol.replace(":", "")];
  for (const protocol of protocols) {
    const origin = originOf(`${protocol}://${host}`);
    if (origin) addresses.add(origin);
  }
  return addresses;
}

function isSameOrigin(value: string, request: NextRequest) {
  const origin = originOf(value);
  return Boolean(origin) && sameOriginAddresses(request).has(origin);
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
