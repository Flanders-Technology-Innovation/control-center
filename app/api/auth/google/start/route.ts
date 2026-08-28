import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isGoogleOAuthClientId } from "@/lib/google-oauth";
import { googleRedirectUri } from "@/lib/server/oauth-redirect";
import { readSettings } from "@/lib/server/settings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const settings = await readSettings();
  if (!settings.newsletters.googleClientId || !settings.newsletters.googleClientSecret) {
    return NextResponse.redirect(new URL("/?tab=settings&section=newsletters&error=oauth-config", request.url));
  }
  if (!isGoogleOAuthClientId(settings.newsletters.googleClientId)) {
    return NextResponse.redirect(new URL("/?tab=settings&section=newsletters&error=oauth-client-id", request.url));
  }
  const state = randomBytes(24).toString("hex");
  const redirectUri = googleRedirectUri(request);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: settings.newsletters.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent select_account",
    state,
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("cc_google_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 600 });
  return response;
}
