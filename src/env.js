const { z } = require('zod');
const { createEnv } = require('@t3-oss/env-nextjs');

const portSchema = z.string().regex(/\d+/).transform(Number).optional()
const envSchema = z.enum(["development", "test", "production"]);

const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: envSchema,
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url(),
    ),
    DEFAULT_COLOR_SCHEME: z.enum(['light', 'dark']).optional().default('light'),
    DOCKER_HOST: z.string().optional(),
    DOCKER_PORT: z.string().regex(/\d+/).transform(Number).optional(),
    PORT: portSchema
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
    NEXT_PUBLIC_PORT: portSchema,
    NEXT_PUBLIC_NODE_ENV: envSchema
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_DISABLE_EDIT_MODE: process.env.DISABLE_EDIT_MODE,
    DISABLE_EDIT_MODE: process.env.DISABLE_EDIT_MODE,
    DEFAULT_COLOR_SCHEME: process.env.DEFAULT_COLOR_SCHEME,
    DOCKER_HOST: process.env.DOCKER_HOST,
    DOCKER_PORT: process.env.DOCKER_PORT,
    VERCEL_URL: process.env.VERCEL_URL,
    PORT: process.env.PORT,
    NEXT_PUBLIC_PORT: process.env.PORT,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV
  },
});

module.exports = {
  env
}