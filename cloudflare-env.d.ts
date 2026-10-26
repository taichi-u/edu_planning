declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PLANNING_OWNER_EMAIL?: string;
  }
}
