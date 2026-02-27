const baseURL = "http://localhost:3000/news"

const container = document.getElementById('container')
const searchInput = document.getElementById('search')
const searchbtn = document.getElementById('search-btn')
const posContainer = document.getElementById('pages')
const pagerLabel = document.getElementById('pagerTitle')

//globals
let totalPageCount;
let mode;

//components


function createCard(title, cve, desc, date){
    const card = document.createElement('div');
    card.setAttribute("class", "card")
    card.innerHTML = `

                    <h3>${title}</h3>
                    <h4>${cve}</h4>
                    <p>Added on: ${date}</p>
                    <p>${desc}</p>

`
container.appendChild(card)
}

//create buttons for scrolling between pages
function createPagePositions(pageNumber){
    const pos = document.createElement('button');
    pos.setAttribute("class", "posButton")
    pos.textContent = pageNumber + 1
    posContainer.appendChild(pos)
}

function pageIterator(pages){
    for (let i=0; i<pages; i++){
        createPagePositions(i)
    }
}

const pageCalculator = (totalPages, resultsPerPage)=>Math.ceil(totalPages/resultsPerPage)


function createSearchCards(cve, desc, published){
    let datePublished = new Date(published).toDateString()
    const card = document.createElement('div');
    card.setAttribute("class", "card")
    card.innerHTML = `

                    <h3>${cve}</h3>
                    <p>Published on: ${datePublished}</p>
                    <p>${desc}</p>

`
container.appendChild(card)
}

function removeExistingCards(){
    const existingCards = document.getElementsByClassName('card')
    Array.from(existingCards).forEach(existing=> existing.remove())
}

function removeExistingPagePos(){
    const existingButtons = document.getElementsByClassName('posButton')
    Array.from(existingButtons).forEach(existing=> existing.remove())
}





async function searchCVE(term, page){
    try{
        const results = await fetch(`${baseURL}/search?keyword=${term}&page=${page}`)
        const searcResults = await results.json()
        return searcResults;
    }catch(e){
        console.log("Error fetching: ", e)
    }
    
}

async function getRecentCVEs(page){

    if(!page) page = 0;

    try{
        const results = await fetch(`${baseURL}?page=${page}`)
        const recentCVEs = await results.json()
        return recentCVEs;
    }catch(e){
        console.log("Error fetching: ", e)
    }
    
}

function getRecentCvesAndDisplay(page){
    mode = 'recent'
    getRecentCVEs(page).then(cves => {
    console.log(cves)
    let totalResults = cves.totalResults;
    totalPageCount = totalResults;
    removeExistingCards()
    cves.vulnerabilities.forEach((element, index) => {
         createCard(element.cve.cisaVulnerabilityName, element.cve.id, element.cve.descriptions[0].value, element.cve.cisaExploitAdd)
    }); 
    removeExistingPagePos()
    pagerLabel.textContent = `Listing ${page + 1} of ${totalPageCount}`
    pageIterator(pageCalculator(totalPageCount, 20))  
});
}

function getSearchResultsAndDisplay(page){
    mode = 'search'
    if(!page) page = 0;

    searchCVE(searchInput.value, page).then(cves=>{
        removeExistingCards()
        console.log(cves)
        console.log(searchInput.value)
        totalPageCount = cves.totalResults
        console.log(totalPageCount)

        cves.vulnerabilities.forEach((element, index) => {
         createSearchCards(element.cve.id, element.cve.descriptions[0].value, element.cve.published)
    });


    removeExistingPagePos()
    pagerLabel.textContent = `Listing ${page + 1} of ${totalPageCount}`
    pageIterator(pageCalculator(totalPageCount, 20))
    })
}

getRecentCvesAndDisplay(0)



const posButtonsHandler = (e) =>{
    e.preventDefault()
    if(e.target.tagName === 'BUTTON'){
            let pageNumber = parseInt(e.target.textContent,10) - 1;
            if (mode === 'recent'){
                if(pageNumber === 0){
                    getRecentCvesAndDisplay(0)
                    return;
                }
                getRecentCvesAndDisplay(pageNumber*20)

            }else if (mode === 'search'){
                if(pageNumber === 0){
                getSearchResultsAndDisplay(0)
                return;
            }
            getSearchResultsAndDisplay(pageNumber*20)
            }
                        
        }
    
        
}


posContainer.addEventListener('click', e=>posButtonsHandler(e))




searchbtn.addEventListener('click', (e)=>{
    e.preventDefault()
    if(searchInput.value === ''){
        return
    }
    getSearchResultsAndDisplay(0)
    
})
//news section