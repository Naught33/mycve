//controller functions for getting news

//baseurl
const baseURL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


function paginate(resultsPerPage ,startpage, URL){
    //prefix the pages to the url string
    let newurlstring = `${URL}&resultsPerPage=${resultsPerPage}&startIndex=${startpage}`
    return newurlstring;
}




const getRecent = async (req, res)=>{
    //calculate the past 3 months
    const currentDate = new Date()
    const pastSixMonths = new Date(currentDate)
    pastSixMonths.setMonth(pastSixMonths.getMonth() - 3)

    //get recents and paginate from the past 3 months
    const recentURL = `${baseURL}/?kevStartDate=${pastSixMonths.toISOString()}&kevEndDate=${currentDate.toISOString()}`
    let pagedURL = paginate(20, 0, recentURL)
    console.log(pagedURL)
    const results = await fetch(pagedURL)
    const recents = await results.json()

    res.json(recents)
}

const searchCve = async(req, res)=>{
    const { keyword } = req.query;

    const searchURL = `${baseURL}?keywordSearch=${keyword}`
    console.info("getting search reaults at: " + searchURL)
    let pagedURL = paginate(20, 0, searchURL)
    const results = await fetch(pagedURL)
    const searchResults = await results.json()
    res.json(searchResults)
}

const fetchByServerity = async (req, res)=>{
    const { serverity } = req.query;

    const serverityURL = `${baseURL}?cvssV4Severity=${serverity}`
    let pagedURL = paginate(20, 0, serverityURL)
    const results = await fetch(pagedURL)
    const serverityResults = await results.json()
    res.json(serverityResults)
}

const fetchByDate = async(req, res)=>{
    const { start: startDate, end: endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    //we check if it is on the same day and stretch it to cover the entire 24 hours
    if (start.toDateString() === end.toDateString()){
         // Start of day UTC
        start.setUTCHours(0, 0, 0, 0);
        // End of day UTC
        end.setUTCHours(23, 59, 59, 999);
    }

    const rangeURL = `${baseURL}/?kevStartDate=${start.toISOString()}&kevEndDate=${end.toISOString()}`
    let pagedURL = paginate(20, 0, rangeURL)
    const results = await fetch(pagedURL)
    const rangeResults = await results.json()
    res.json(rangeResults)
}

module.exports = {
    getRecent,
    searchCve,
    fetchByServerity,
    fetchByDate
}

