const baseURL = "http://localhost:3000/news"

const container = document.getElementById('container')
const searchInput = document.getElementById('search')
const searchbtn = document.getElementById('search-btn')

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

function createSearchCards(cve, desc, published){
    const card = document.createElement('div');
    card.setAttribute("class", "card")
    card.innerHTML = `

                    <h3>${cve}</h3>
                    <p>Published on: ${published}</p>
                    <p>${desc}</p>

`
container.appendChild(card)
}

function removeExistingCards(){
    const existingCards = document.getElementsByClassName('card')
    Array.from(existingCards).forEach(existing=> existing.remove())
}





async function searchCVE(term){
    try{
        const results = await fetch(`${baseURL}/search?keyword=${term}`)
        const searcResults = await results.json()
        return searcResults;
    }catch(e){
        console.log("Error fetching: ", e)
    }
    
}

async function getRecentCVEs(){
    try{
        const results = await fetch(baseURL)
        const recentCVEs = await results.json()
        return recentCVEs;
    }catch(e){
        console.log("Error fetching: ", e)
    }
    
}

getRecentCVEs().then(cves => {
    console.log(cves.vulnerabilities)
    removeExistingCards()
    cves.vulnerabilities.forEach((element, index) => {
         createCard(element.cve.cisaVulnerabilityName, element.cve.id, element.cve.descriptions[0].value, element.cve.cisaExploitAdd)
    });
    
})

searchbtn.addEventListener('click', (e)=>{
    e.preventDefault()
    if(searchInput.value === ''){
        return
    }
    searchCVE(searchInput.value).then(cves=>{
        removeExistingCards()
        console.log(cves)
        console.log(searchInput.value)
        cves.vulnerabilities.forEach((element, index) => {
         createSearchCards(element.cve.id, element.cve.descriptions[0].value, element.cve.published)
    });
    })
})