const express = require("express");
const os = require("os");
const { Client } = require("pg");
const app = express();

app.use(express.static("public"));
app.set("view engine", "pug");
let client = undefined;

async function insertVisit({ ip, hostname, path }) {
  const query =
    "INSERT INTO requests (ip, path, host, requested_at) VALUES ($1, $2, $3, $4)";
  const values = [ip, path, hostname, Date.now()];
  const res = await client.query(query, values);
  return res;
}

async function getVisits() {
  const sql =
    "SELECT ip, path, host, requested_at FROM requests ORDER BY id DESC LIMIT 25;";
  const res = await client.query(sql);
  return res;
}

app.get("/", async (req, res, next) => {
  let ip = (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  ).split(",")[0];
  if (ip.startsWith("::ffff:")) {
    ip = ip.substr(7);
  }
  await insertVisit({ ip, hostname: os.hostname(), path: req.url });
  const result = await getVisits();

  res.render("index", { ips: result.rows });
});

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_DELAY = 10000; // in ms

const waitForPostgres = (
  {
    databaseUrl = process.env.DATABASE_URL || "postgres://postgres@localhost",
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    delay = DEFAULT_DELAY,
  } = {},
  retries = 1,
) => {
  client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
  });
  return client.connect().then(
    () => {
      console.log("Postgres is up");
      return client.end();
    },
    () => {
      if (retries > maxAttempts) {
        return Promise.reject(error);
      }
      console.log("Postgres is unavailable - sleeping");
      return timeout(delay).then(() =>
        waitForPostgres({ databaseUrl, maxAttempts, delay }, retries + 1),
      );
    },
  );
};

waitForPostgres()
  .then(() => {
    app.listen(3000, () => {
      console.log("App is listening on port 3000");
    });
  })
  .catch(err => {
    console.log("unable to connect to db");
    process.exit();
  });

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));
