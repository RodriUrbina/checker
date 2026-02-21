import type { User } from "../../drizzle/schema";
import { getSessionCookie, verifySessionToken } from "./auth";
import { getUserByGoogleId } from "../db";

export type TrpcContext = {
  req: Request;
  user: User | null;
};

export async function createContext(req: Request): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = getSessionCookie(req);
    if (token) {
      const googleId = await verifySessionToken(token);
      if (googleId) {
        user = (await getUserByGoogleId(googleId)) ?? null;
      }
    }
  } catch {
    user = null;
  }

  return { req, user };
}
