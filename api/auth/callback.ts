import { getGoogleOAuth, parseCookies, buildSetCookieHeader, createSessionToken, getAppUrl } from "../../server/_core/auth";
import { upsertUser } from "../../server/db";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Parse the oauth_state cookie
  const cookies = parseCookies(req.headers.get("cookie"));
  const oauthRaw = cookies["oauth_state"];
  if (!oauthRaw) {
    return new Response("Missing OAuth state cookie", { status: 400 });
  }

  let stored: { state: string; codeVerifier: string; returnTo: string };
  try {
    stored = JSON.parse(oauthRaw);
  } catch {
    return new Response("Invalid OAuth state cookie", { status: 400 });
  }

  if (state !== stored.state) {
    return new Response("State mismatch", { status: 400 });
  }

  const google = getGoogleOAuth();
  const tokens = await google.validateAuthorizationCode(code, stored.codeVerifier);
  const accessToken = tokens.accessToken();

  // Fetch Google user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userInfoRes.ok) {
    return new Response("Failed to fetch user info from Google", { status: 500 });
  }

  const googleUser = (await userInfoRes.json()) as {
    id: string;
    name?: string;
    email?: string;
  };

  // Upsert user in database
  const user = await upsertUser({
    googleId: googleUser.id,
    name: googleUser.name ?? null,
    email: googleUser.email ?? null,
  });

  // Create session JWT
  const sessionToken = await createSessionToken(user.googleId);
  const sessionCookie = buildSetCookieHeader(sessionToken);

  // Clear the oauth_state cookie
  const clearOauthCookie = "oauth_state=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0";

  const returnTo = stored.returnTo || "/";
  const redirectUrl = `${getAppUrl()}${returnTo}`;

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", redirectUrl],
      ["Set-Cookie", sessionCookie],
      ["Set-Cookie", clearOauthCookie],
    ],
  });
}
