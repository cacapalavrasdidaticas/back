import pgp from "pg-promise";

const db = pgp()({
  connectionString:
    // "postgres://umbugqae:ZA0JreAaEsvtGAyVglGqp9xg9bMYz95k@kesavan.db.elephantsql.com/umbugqae",
    "postgres://default:d8VTUYrwEXJ7@ep-bitter-frost-a4rijx1f.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;
