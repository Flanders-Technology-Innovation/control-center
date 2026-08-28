import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

function apiRequest(origin?: string) {
  return new NextRequest("http://127.0.0.1:3000/api/brief", {
    headers: {
      host: "127.0.0.1:3000",
      ...(origin ? { origin } : {}),
    },
  });
}

// The gateway rewrites Host to the public name but still reaches the container
// on its internal port, so request.url keeps that port while the browser's
// Origin never carries it.
function gatewayRequest(
  origin: string,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://control-center.spin.elli.be:3000/api/brief", {
    headers: {
      host: "control-center.spin.elli.be",
      "x-forwarded-host": "control-center.spin.elli.be",
      origin,
      ...headers,
    },
  });
}

test("proxy allows browser requests only from the exact API origin", () => {
  assert.equal(proxy(apiRequest("http://127.0.0.1:3000")).status, 200);
  assert.equal(proxy(apiRequest("http://127.0.0.1:3001")).status, 403);
  assert.equal(proxy(apiRequest("http://localhost:3000")).status, 403);
  assert.equal(proxy(apiRequest("https://127.0.0.1:3000")).status, 403);
});

test("proxy allows local CLI requests without an Origin header", () => {
  assert.equal(proxy(apiRequest()).status, 200);
});

// Regression: every write behind the gateway answered 403, so the browser's
// first-run workspace import failed and the app refused to open.
test("proxy allows writes from the app's own public address", () => {
  assert.equal(
    proxy(
      gatewayRequest("https://control-center.spin.elli.be", {
        "x-forwarded-proto": "https",
      }),
    ).status,
    200,
  );
});

test("proxy allows the public address when the gateway omits the scheme", () => {
  assert.equal(
    proxy(gatewayRequest("https://control-center.spin.elli.be")).status,
    200,
  );
});

test("proxy trusts SPIN_APP_URL over the forwarding headers", () => {
  process.env.SPIN_APP_URL = "https://control-center.spin.elli.be";
  try {
    const request = new NextRequest("http://127.0.0.1:3000/api/brief", {
      headers: {
        host: "127.0.0.1:3000",
        origin: "https://control-center.spin.elli.be",
      },
    });
    assert.equal(proxy(request).status, 200);
  } finally {
    delete process.env.SPIN_APP_URL;
  }
});

test("proxy still blocks cross-site origins behind the gateway", () => {
  assert.equal(proxy(gatewayRequest("https://elli.example")).status, 403);
  assert.equal(
    proxy(
      gatewayRequest("https://control-center.spin.elli.be.evil.example"),
    ).status,
    403,
  );
  assert.equal(proxy(gatewayRequest("null")).status, 403);
});
