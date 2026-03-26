const express = require('express')
const app = express()
const port = 3000
require("dotenv").config();

const cors = require('cors')
app.use(cors())

//routes
const cveRoute = require("./routes/cveRoute.js")
const newsRoute = require("./routes/newsRoutes.js")
const dbroutes = require("./routes/db.js");


//endpoints
app.use("/cve", cveRoute);
app.use("/news",newsRoute);
app.use('/msf', dbroutes)

//alive check
app.get("/", (req, res)=>{
    res.json({
        "message": `Server is on and running at port: ${port}`
    })
})


app.listen(port, () => {
  console.log(`cve news is active on ${port}`)
})
