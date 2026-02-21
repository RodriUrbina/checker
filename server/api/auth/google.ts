import { generateCodeVerifier, generateState } from "arctic";
import { getGoogleOAuth } from "../../_core/auth";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/";

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const google = getGoogleOAuth();

  const authUrl = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "email",
    "profile",
  ]);

  const cookiePayload = JSON.stringify({ state, codeVerifier, returnTo });
  const oauthCookie = `oauth_state=${encodeURIComponent(cookiePayload)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`;

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", authUrl.toString()],
      ["Set-Cookie", oauthCookie],
      ["Cache-Control", "private, no-store"],
    ],
  });
}
