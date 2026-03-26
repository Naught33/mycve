/**
 * msfLoaderController.js
 * -----------------------
 * Express controller that reads msf_references.json from the assets folder
 * and loads it into Postgres. Call this as an endpoint in your router.
 *
 * Expected project structure:
 *   your-project/
 *   ├── assets/
 *   │   └── msf_references.json   ← JSON file goes here
 *   └── controllers/
 *       └── msfLoaderController.js
 *
 * Required .env variables:
 *   DB_HOST
 *   DB_PORT
 *   DB_NAME
 *   DB_USER
 *   DB_PASSWORD
 *
 * Example route registration (in your router file):
 *   const msfLoader = require("./controllers/msfLoaderController");
 *   router.post("/admin/load-msf", msfLoader.loadMsfReferences);
 */

const fs   = require("fs");
const path = require("path");
const { Pool } = require("pg");

// ------------------------------------------------------------------
// DB pool — reads credentials from environment variables
// ------------------------------------------------------------------
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ------------------------------------------------------------------
// Path to the JSON file — one folder up in assets/
// ------------------------------------------------------------------
const JSON_PATH = path.resolve(__dirname, "..", "assets", "msf_references.json");

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Create tables and indexes if they don't already exist.
 * Safe to call on every run — will never overwrite existing data.
 */
async function createTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS msf_references (
      id      SERIAL PRIMARY KEY,
      source  TEXT NOT NULL UNIQUE,
      module  TEXT,
      cve     TEXT,
      osvdb   TEXT,
      edb     TEXT
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS msf_urls (
      id            SERIAL PRIMARY KEY,
      reference_id  INT NOT NULL REFERENCES msf_references(id) ON DELETE CASCADE,
      url           TEXT NOT NULL,
      UNIQUE (reference_id, url)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_msf_references_module ON msf_references(module);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_msf_references_cve ON msf_references(cve);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_msf_urls_reference_id ON msf_urls(reference_id);
  `);
}

/**
 * Normalize the URL field from the JSON.
 * It can be null, a plain string, or an array of strings.
 * Always returns a plain array.
 */
function normalizeUrls(urlField) {
  if (!urlField)                    return [];
  if (typeof urlField === "string") return [urlField];
  return urlField;
}

/**
 * Upsert all records into msf_references and msf_urls.
 * Duplicates are silently skipped.
 */
async function loadRecords(client, records) {
  let insertedRefs = 0;
  let skippedRefs  = 0;
  let insertedUrls = 0;
  let skippedUrls  = 0;

  for (const record of records) {
    const source = record.source ?? null;
    const module = record.module ?? null;
    const cve    = record.CVE    ?? null;
    const osvdb  = record.OSVDB  ?? null;
    const edb    = record.EDB    ?? null;
    const urls   = normalizeUrls(record.URL);

    // ── Upsert msf_references ──────────────────────────────────
    const refResult = await client.query(
      `INSERT INTO msf_references (source, module, cve, osvdb, edb)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source) DO NOTHING
       RETURNING id;`,
      [source, module, cve, osvdb, edb]
    );

    let refId;

    if (refResult.rows.length > 0) {
      refId = refResult.rows[0].id;
      insertedRefs++;
    } else {
      // Already exists — still fetch its id so we can handle new URLs
      const existing = await client.query(
        `SELECT id FROM msf_references WHERE source = $1;`,
        [source]
      );
      refId = existing.rows[0].id;
      skippedRefs++;
    }

    // ── Upsert msf_urls ────────────────────────────────────────
    for (const url of urls) {
      const urlResult = await client.query(
        `INSERT INTO msf_urls (reference_id, url)
         VALUES ($1, $2)
         ON CONFLICT (reference_id, url) DO NOTHING
         RETURNING id;`,
        [refId, url]
      );

      if (urlResult.rows.length > 0) {
        insertedUrls++;
      } else {
        skippedUrls++;
      }
    }
  }

  return { insertedRefs, skippedRefs, insertedUrls, skippedUrls };
}

// ------------------------------------------------------------------
// Controller
// ------------------------------------------------------------------

/**
 * POST /admin/load-msf  (or whatever route you attach this to)
 *
 * Response shape:
 * {
 *   "success": true,
 *   "message": "Load complete.",
 *   "summary": {
 *     "totalInJson":    4532,
 *     "refsInserted":   4532,
 *     "refsSkipped":       0,
 *     "urlsInserted":   7821,
 *     "urlsSkipped":       0
 *   }
 * }
 */
async function loadMsfReferences(req, res) {
  // ── Check the JSON file exists ────────────────────────────────
  if (!fs.existsSync(JSON_PATH)) {
    return res.status(404).json({
      success: false,
      message: `JSON file not found at: ${JSON_PATH}`,
    });
  }

  // ── Parse JSON ────────────────────────────────────────────────
  let records;
  try {
    const raw = fs.readFileSync(JSON_PATH, "utf-8");
    const data = JSON.parse(raw);
    records = data.References ?? [];
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to read or parse JSON: ${err.message}`,
    });
  }

  if (records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No records found in the JSON file. Nothing to load.",
    });
  }

  // ── Run inside a single transaction ──────────────────────────
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await createTables(client);
    const summary = await loadRecords(client, records);
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Load complete.",
      summary: {
        totalInJson:  records.length,
        refsInserted: summary.insertedRefs,
        refsSkipped:  summary.skippedRefs,
        urlsInserted: summary.insertedUrls,
        urlsSkipped:  summary.skippedUrls,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: `Database error: ${err.message}`,
    });
  } finally {
    client.release();
  }
}

module.exports = { loadMsfReferences };