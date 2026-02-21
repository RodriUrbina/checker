import { buildClearCookieHeader, getAppUrl } from "../../_core/auth";

export default async function handler() {
  return new Response(null, {
    status: 302,
    headers: [
      ["Location", getAppUrl()],
      ["Set-Cookie", buildClearCookieHeader()],
      ["Cache-Control", "private, no-store"],
    ],
  });
}
