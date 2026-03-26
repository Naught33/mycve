const baseURL = "http://localhost:3000/cve"

const container = document.getElementById('container')
const searchInput = document.getElementById('search')
const searchbtn = document.getElementById('search-btn')
const posContainer = document.getElementById('pages')
const pagerLabel = document.getElementById('pagerTitle')
const cveModal = document.getElementById('cve-modal')
const dynamicPellets = document.getElementsByClassName('dynamic');

//imports
import { checkCve, checkCveReferences } from './msfdb.js'

//globals
let totalPageCount;
let mode;
let modalVisible = false;
let vulns;


//components


function createCard(title, cve, desc, date, index){
    const card = document.createElement('div');
    card.setAttribute("class", "card")
    card.setAttribute("data-index", index)
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

//function defs
function openModal(){
    if(modalVisible){
        return;
    }
    cveModal.classList.add('show-modal');
    modalVisible = true;
}

function closeModal(){
    if(!modalVisible){
        return;
    }
    cveModal.classList.remove('show-modal');
    modalVisible = false;
}

function checkScoreAndReturnClass(score){
    if (score === 0) return "Informational";
    if (score <= 3.9) return "Low";
    if (score <= 6.9) return "Medium";
    if (score <= 8.9) return "High";
    return "Critical";
}

function populateModal(
    title,
    id,
    published,
    lastModified,
    baseCvssScore,
    baseServerity,
    cvssString,
    description,
    references
){

     const refLinks = references
        .filter(reference => reference.url) // avoid undefined
        .map(reference => {
            return `<a href="${reference.url}" target="_blank" rel="noopener noreferrer">
                        ${reference.url}
                    </a>`;
        })
        .join('\n');
    const modalInner = `
    <h2 class="modal-title">${title}
            <ion-icon id="close-cve-modal" name="close-circle-sharp"></ion-icon>
        </h2>
        <h3>${id}</h3>
        <div class="dates">
            <p>Published: ${new Date(published).toDateString()}</p>
            <p>Last Modified: ${new Date(lastModified).toDateString()}</p>
        </div>
        <div class="pellet dynamic ${checkScoreAndReturnClass(parseFloat(baseCvssScore))}">
            <p>${baseCvssScore + " " + baseServerity}</p>
        </div>
        <p>CVSS V3: ${cvssString}</p>
        <p><b>Description</b></p>
        <p>
            ${description}
        </p>

        <div class="pocs">
            <div class="pellet static">
                <p>
                    Metasploit
                </p>
            </div>

            <div class="pellet static">
                <p>
                    EDB
                </p>
            </div>

            <div class="pellet static">
                <p>
                    OSVDB
                </p>
            </div>
        </div>
        <p><b>References</b></p>
        <div class="references">
           ${refLinks || '<p>No references available</p>'}
        </div>
    `;
    cveModal.innerHTML = modalInner;
    document.getElementById('close-cve-modal').onclick=()=>{
        closeModal();
    }
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
    console.log(cves.vulnerabilities)
    vulns = cves.vulnerabilities
    let totalResults = cves.totalResults;
    totalPageCount = totalResults;
    removeExistingCards()
    cves.vulnerabilities.forEach((element, index) => {
         createCard(element.cve.cisaVulnerabilityName, element.cve.id, element.cve.descriptions[0].value, element.cve.published, index)
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

container.addEventListener('click', e=>{
    const card = e.target.closest('.card')

    if(card){
        let baseVuln = (vulns[card.getAttribute('data-index')].cve)
        console.log(baseVuln);
        populateModal(
            baseVuln.cisaVulnerabilityName,
            baseVuln.id,
            baseVuln.published,
            baseVuln.lastModified,
            baseVuln.metrics.cvssMetricV31[0].cvssData.baseScore,
            baseVuln.metrics.cvssMetricV31[0].cvssData.baseSeverity,
            baseVuln.metrics.cvssMetricV31[0].cvssData.vectorString,
            baseVuln.descriptions[0].value,
            baseVuln.references
        )
        openModal();
    }
})




//news section