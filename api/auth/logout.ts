import { buildClearCookieHeader, getAppUrl } from "../../server/_core/auth";

export default async function handler() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: getAppUrl(),
      "Set-Cookie": buildClearCookieHeader(),
    },
  });
}
