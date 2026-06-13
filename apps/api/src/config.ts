import "dotenv/config";

export const config = {
  databaseUrl:
    process.env.DATABASE_URL || "postgres://scp:scp@localhost:5432/scp_portal",
  port: Number(process.env.API_PORT || 4000),
};
