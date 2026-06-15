import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "../server/src/server.js";

const serverPromise = buildServer().then(async ({ app }) => {
  await app.ready();
  return app;
});

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await serverPromise;
  app.server.emit("request", request, response);
}
