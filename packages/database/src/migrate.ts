import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./client.js";

const dirname = fileURLToPath(new URL(".", import.meta.url));
const migrationsDir = join(dirname, "../migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL ?? "postgres://scp:scp@localhost:5432/scp_portal";
  const { pool } = createDatabase(connectionString);

  try {
    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const file of files) {
      const alreadyApplied = await pool.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [
        file,
      ]);

      if (alreadyApplied.rowCount) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await pool.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

