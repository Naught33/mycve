const express = require('express')
const router = express.Router()

const {
    getRecent,
    searchCve,
    fetchByServerity,
    fetchByDate
} = require("../controllers/newsController");


//routes

router.get("/",getRecent)
router.get("/serverity",fetchByServerity)
router.get("/by-date", fetchByDate)
router.get("/search", searchCve)

module.exports = router;