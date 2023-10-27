const axios = require("axios");
const cheerio = require("cheerio");

const isLink = (el) => {
  return "a" === el.name;
};

const getList = async (req, res) => {
  try {
    const response = await axios.get("https://alkitab.mobi/kidung/kj");
    const htmlData = response.data;
    const regex = /\d+/;

    const $ = cheerio.load(htmlData);
    const links = $("a");
    const songs = [];

    links.each((_, element) => {
      const text = $(element).text().trim();
      if (text.includes("KJ ")) {
        const title = text.split("-")[1].trim();
        const link = element.attribs.href;
        const [id] = link.match(regex);
        const song = {
          id,
          title,
        };
        songs.push(song);
      }
    });
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching the data (${error})`,
    });
  }
};

const sanitizeCheerioElement = ($, e) => {
  let t = $(e).text();

  let b = t.split("\n");

  b = b
    .filter((v) => v !== "")
    .map((v) => {
      return v.trim();
    })
    .filter((v) => v !== "")
    .filter((v) => v !== "Play");

  return b;
};

const convertToSongStruct = (a) => {
  let el = "verse";

  if (a[0] === "Reff:") {
    el = "reff";
  }

  let obj = {
    element: el,
    content: a[1],
  };

  return obj;
};

const getSongData = async (req, res) => {
  const { id } = req.params;

  try {
    let data = await axios.get(`https://alkitab.mobi/kidung/kj/${id}`);
    let htmlData = data.data;

    let $ = cheerio.load(htmlData);
    let a = $("p.paragraphtitle");
    let cc = a.nextUntil("hr");

    let title = $("title")
      .text()
      .replace(/KJ\s([0-9]{1,3}\s-\s)/, "");

    let idNumber = parseInt(id) || 0;

    let song = {
      title: "",
      lyrics: [],
      id: idNumber,
    };

    song.title = title;

    cc.each((_, v) => {
      $(v).each((_, e) => {
        let b = sanitizeCheerioElement($, e);

        if (b.length > 0) {
          let ss = convertToSongStruct(b);
          song.lyrics.push(ss);
        }
      });
    });

    res.status(200).json(song);
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching the data (${error})`,
    });
  }
};

module.exports = {
  getList,
  getSongData,
};
