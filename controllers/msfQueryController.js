/**
 * msfQueryController.js
 * ----------------------
 * Express controller for querying the Metasploit references database.
 *
 * Endpoints:
 *   GET /msf/cve/:cve            — Check if a CVE exists in Metasploit
 *   GET /msf/cve/:cve/references — Check if a CVE has EDB or OSVDB references
 *
 * Example route registration (in your router file):
 *   const msfQuery = require("./controllers/msfQueryController");
 *   router.get("/msf/cve/:cve", msfQuery.checkCve);
 *   router.get("/msf/cve/:cve/references", msfQuery.checkCveReferences);
 */

const pool = require("../config/db");

// ------------------------------------------------------------------
// GET /msf/cve/:cve
// Check if a CVE exists in the database (and therefore in Metasploit)
// and return which Metasploit module it belongs to.
// ------------------------------------------------------------------
async function checkCve(req, res) {
  const cve = req.params.cve.toUpperCase();

  try {
    const result = await pool.query(
      `SELECT id, source, module, cve
       FROM msf_references
       WHERE UPPER(cve) = $1
       LIMIT 1;`,
      [cve]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        exists:            false,
        cve,
        metasploitModule:  null,
      });
    }

    const row = result.rows[0];

    return res.status(200).json({
      exists:           true,
      cve:              row.cve,
      metasploitModule: row.module,
      source:           row.source,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Database error: ${err.message}`,
    });
  }
}

// ------------------------------------------------------------------
// GET /msf/cve/:cve/references
// Check if a CVE has EDB or OSVDB references, and return any URLs
// associated with it.
// ------------------------------------------------------------------
async function checkCveReferences(req, res) {
  const cve = req.params.cve.toUpperCase();

  try {
    // Fetch the main reference record
    const refResult = await pool.query(
      `SELECT id, module, cve, edb, osvdb
       FROM msf_references
       WHERE UPPER(cve) = $1
       LIMIT 1;`,
      [cve]
    );

    if (refResult.rows.length === 0) {
      return res.status(200).json({
        found:   false,
        cve,
        message: "CVE not found in Metasploit database",
      });
    }

    const row = refResult.rows[0];

    // Fetch all URLs linked to this record
    const urlResult = await pool.query(
      `SELECT url FROM msf_urls WHERE reference_id = $1;`,
      [row.id]
    );

    const urls = urlResult.rows.map((r) => r.url);

    return res.status(200).json({
      found:            true,
      cve:              row.cve,
      metasploitModule: row.module,
      hasEdb:           row.edb !== null,
      edb:              row.edb,
      hasOsvdb:         row.osvdb !== null,
      osvdb:            row.osvdb,
      urls,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Database error: ${err.message}`,
    });
  }
}

module.exports = { checkCve, checkCveReferences };