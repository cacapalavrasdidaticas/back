import pgp from "pg-promise";

const db = pgp()({
  connectionString:
    "postgres://umbugqae:ZA0JreAaEsvtGAyVglGqp9xg9bMYz95k@kesavan.db.elephantsql.com/umbugqae",
  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;