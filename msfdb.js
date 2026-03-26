/**
 * msfQueries.js
 * --------------
 * Frontend query functions for the Metasploit references API.
 * Import these in your main.js to query and display results on the UI.
 *
 * Usage in main.js:
 *   const { checkCve, checkCveReferences } = require("./msfQueries");
 *   // or if using ES Modules:
 *   import { checkCve, checkCveReferences } from "./msfQueries.js";
 */

// ------------------------------------------------------------------
// Base URL — change this if your API runs on a different host/port
// ------------------------------------------------------------------
const API_BASE = "http://localhost:3000";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Shared fetch wrapper.
 * Returns { data, error } so callers never have to try/catch themselves.
 */
async function apiFetch(url) {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      return { data: null, error: `Server responded with status ${res.status}` };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: `Network error: ${err.message}` };
  }
}

// ------------------------------------------------------------------
// Query 1 — Check if a CVE exists in Metasploit
// ------------------------------------------------------------------

/**
 * Checks whether a CVE exists in the Metasploit database.
 *
 * @param {string} cve - The CVE ID e.g. "CVE-2021-44228"
 * @returns {Promise<{
 *   exists: boolean,
 *   cve: string,
 *   metasploitModule: string|null,
 *   source: string|null,
 *   error: string|null
 * }>}
 *
 * Example usage:
 *   const result = await checkCve("CVE-2021-44228");
 *   if (result.error) { ... handle error ... }
 *   if (result.exists) {
 *     console.log(`Found in Metasploit module: ${result.metasploitModule}`);
 *   }
 */
async function checkCve(cve) {
  if (!cve || typeof cve !== "string") {
    return { exists: false, cve: null, metasploitModule: null, source: null, error: "Invalid CVE provided" };
  }

  const { data, error } = await apiFetch(`${API_BASE}/msf/cve/${encodeURIComponent(cve.trim())}`);

  if (error) {
    return { exists: false, cve, metasploitModule: null, source: null, error };
  }

  return {
    exists:           data.exists,
    cve:              data.cve ?? cve,
    metasploitModule: data.metasploitModule ?? null,
    source:           data.source ?? null,
    error:            null,
  };
}

// ------------------------------------------------------------------
// Query 2 — Check if a CVE has EDB or OSVDB references
// ------------------------------------------------------------------

/**
 * Checks whether a CVE has EDB or OSVDB references in the database,
 * and returns any associated URLs.
 *
 * @param {string} cve - The CVE ID e.g. "CVE-2021-44228"
 * @returns {Promise<{
 *   found: boolean,
 *   cve: string,
 *   metasploitModule: string|null,
 *   hasEdb: boolean,
 *   edb: string|null,
 *   hasOsvdb: boolean,
 *   osvdb: string|null,
 *   urls: string[],
 *   error: string|null
 * }>}
 *
 * Example usage:
 *   const result = await checkCveReferences("CVE-2021-44228");
 *   if (result.found && result.hasEdb) {
 *     console.log(`EDB ID: ${result.edb}`);
 *   }
 */
async function checkCveReferences(cve) {
  if (!cve || typeof cve !== "string") {
    return {
      found: false, cve: null, metasploitModule: null,
      hasEdb: false, edb: null, hasOsvdb: false, osvdb: null,
      urls: [], error: "Invalid CVE provided",
    };
  }

  const { data, error } = await apiFetch(
    `${API_BASE}/msf/cve/${encodeURIComponent(cve.trim())}/references`
  );

  if (error) {
    return {
      found: false, cve, metasploitModule: null,
      hasEdb: false, edb: null, hasOsvdb: false, osvdb: null,
      urls: [], error,
    };
  }

  // CVE not found in DB
  if (!data.found) {
    return {
      found: false, cve: data.cve ?? cve, metasploitModule: null,
      hasEdb: false, edb: null, hasOsvdb: false, osvdb: null,
      urls: [], error: null,
    };
  }

  return {
    found:            true,
    cve:              data.cve,
    metasploitModule: data.metasploitModule ?? null,
    hasEdb:           data.hasEdb,
    edb:              data.edb ?? null,
    hasOsvdb:         data.hasOsvdb,
    osvdb:            data.osvdb ?? null,
    urls:             data.urls ?? [],
    error:            null,
  };
}

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------
export { checkCve, checkCveReferences };