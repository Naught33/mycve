const axios = require("axios");
const xml2js = require("xml2js");

const RSS_LINK = 'https://feeds.feedburner.com/TheHackersNews'
const parser = new xml2js.Parser({ explicitArray: false });

const getNews = async (req, res)=>{
    try {
    const response = await axios.get(RSS_LINK);

    const parsed = await parser.parseStringPromise(response.data);

    const items = parsed.rss.channel.item;

    const formatted = items.map((item) => ({
      title: item.title,
      publish_date: item.pubDate,
      author: item.author,
      link: item.link,
      description: item.description?.trim(),
      image_url: item.enclosure?.$?.url || null
    }));

    res.json({
      status: "success",
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch or parse RSS feed" });
  }
}

module.exports = {
    getNews
}