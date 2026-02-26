const express = require('express')
const app = express()
const port = 3000

const cors = require('cors')
app.use(cors())

//routes
const newsRoute = require("./routes/newsRoute.js")


//endpoints
app.use("/news", newsRoute);

//alive check
app.get("/", (req, res)=>{
    res.json({
        "message": `Server is on and running at port: ${port}`
    })
})


app.listen(port, () => {
  console.log(`cve news is active on ${port}`)
})
