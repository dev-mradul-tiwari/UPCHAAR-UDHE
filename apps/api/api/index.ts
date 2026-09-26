/**
 * Vercel serverless entrypoint for the Upchaar Express API.
 *
 * Vercel Functions expect a default-exported Node.js request handler, NOT a
 * long-running `app.listen()` process. This file re-uses the same `createApp()`
 * factory used by the Docker / local development entrypoint (src/index.ts) so
 * all routes, middleware, and business logic are identical — only the binding
 * mechanism differs.
 *
 * src/index.ts  → used by Docker / `pnpm dev`  (calls app.listen)
 * api/index.ts  → used by Vercel Functions       (exports the handler)
 */
import { createApp } from "../src/app.js";

const app = createApp();

export default app;
