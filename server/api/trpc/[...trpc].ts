import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../routers";
import { createContext } from "../../_core/context";

export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req }) => createContext(req),
  });
}
