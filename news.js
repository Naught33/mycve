const BASE_URL = "http://localhost:3000/news"
let latestArticles;

const feed = document.getElementById('news');



//function defs


async function getNews(){
    try{
        const result = await fetch(BASE_URL);
        const news = await result.json();
        return news;
    }catch(e){
        console.log("An Error occured, try to refresh.")
    }
    
}

getNews().then((news)=>{
    latestArticles = news.data.slice(0,5);
    let testFeed = latestArticles[0]
    console.log(testFeed)
    feed.innerHTML = createFeed(testFeed.title, testFeed.author, testFeed.publish_date, testFeed.image_url, testFeed.description, testFeed.link)
})

function createFeed(Title, author, published, url, description, link){
    let html = `
        <a class="news-anchor" href="${link}" target="_blank" style="
        background: linear-gradient(rgba(0, 0, 0, 0.69), rgba(0, 0, 0, 0.54)), url('${url}'); 
        background-position: center; 
        background-size: cover;
        height: 100%;
        width: 100%;
        display: block;">
                        <h2>${Title}</h2>
                        <span><p>${author}</p><p>${published}</p></span>
                        <p>${description}</p>
        </a>
    `
    return html;
}