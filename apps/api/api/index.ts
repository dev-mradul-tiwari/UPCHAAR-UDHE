// We import the fully bundled ESBuild output so Vercel's legacy compiler doesn't trace app.ts and fail with ESM errors
import app from "../dist/serverless.js";
export default app;
