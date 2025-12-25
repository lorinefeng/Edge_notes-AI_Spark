import { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    STORAGE: R2Bucket;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    JWT_SECRET: string;
    ANTHROPIC_API_KEY: string;
    ANTHROPIC_BASE_URL: string;
    ANTHROPIC_MODEL: string;
  }
}
