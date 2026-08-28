import { NextRequest, NextResponse } from "next/server";
import { googleRedirectUri } from "@/lib/server/oauth-redirect";
import { readSettings, saveGmailTokens } from "@/lib/server/settings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("cc_google_oauth_state")?.value;
  const destination = new URL("/?tab=settings&section=newsletters", request.url);
  if (!code || !state || state !== expectedState) {
    destination.searchParams.set("error", "oauth-state");
    return NextResponse.redirect(destination);
  }
  const settings = await readSettings();
  const redirectUri = googleRedirectUri(request);
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: settings.newsletters.googleClientId, client_secret: settings.newsletters.googleClientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) throw new Error("Token exchange failed");
    const tokens = await tokenResponse.json() as { access_token: string; refresh_token?: string; expires_in: number };
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new Error("Could not read Google profile");
    const profile = await profileResponse.json() as { email: string };
    await saveGmailTokens({ email: profile.email, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + tokens.expires_in * 1000 });
    destination.searchParams.set("connected", "1");
  } catch {
    destination.searchParams.set("error", "oauth-exchange");
  }
  const response = NextResponse.redirect(destination);
  response.cookies.delete("cc_google_oauth_state");
  return response;
}
