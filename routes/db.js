const express = require('express')
const router = express.Router()

const { loadMsfReferences } = require('../controllers/msfLoaderController');
const msfQuery = require("../controllers/msfQueryController");

router.post('/load_msf_references', loadMsfReferences);
router.get("/cve/:cve", msfQuery.checkCve);
router.get("/cve/:cve/references", msfQuery.checkCveReferences);

module.exports = router;