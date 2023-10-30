const axios = require("axios");
const cheerio = require("cheerio");

const isLink = (el) => {
  return "a" === el.name;
};

const getList = async (req, res) => {
  try {
    const songversion = {
      kj: {
        url: "https://alkitab.mobi/kidung/kj",
        name: "Kidung Jemaat",
      },
      pkj: {
        url: "https://alkitab.mobi/kidung/pkj",
        name: "Pelengkap Kidung Jemaat",
      },
      nkb: {
        url: "https://alkitab.mobi/kidung/nkb",
        name: "Nyanyikanlah Kidung Baru",
      },
    };

    const versionKey = req.params.source.toLowerCase();
    const versionData = songversion[versionKey];

    if (!versionData) {
      return res.status(400).json({ error: "Invalid version" });
    }

    const { url, name } = versionData;

    const response = await axios.get(url);
    const htmlData = response.data;
    const regex = /\d+/;

    const $ = cheerio.load(htmlData);
    const links = $("a");
    const songs = [];

    links.each((_, element) => {
      const text = $(element).text().trim();
      if (versionKey === "nkb") {
        if (text.includes("NKB ")) {
          const title = text.split("-")[1].trim();
          const link = element.attribs.href;
          const [id] = link.match(regex);
          const song = {
            source: name,
            id,
            title,
          };
          songs.push(song);
        }
      } else if (versionKey === "pkj") {
        if (text.includes("PKJ ")) {
          const title = text.split("-")[1].trim();
          const link = element.attribs.href;
          const [id] = link.match(regex);
          const song = {
            source: name,
            id,
            title,
          };
          songs.push(song);
        }
      } else {
        if (text.includes("KJ ")) {
          const title = text.split("-")[1].trim();
          const link = element.attribs.href;
          const [id] = link.match(regex);
          const song = {
            source: name,
            id,
            title,
          };
          songs.push(song);
        }
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
  const id = req.params.id;
  const versionKey = req.params.source.toLowerCase();

  const songversion = {
    kj: ["Kidung Jemaat"],
    pkj: ["Pelengkap Kidung Jemaat"],
    nkb: ["Nyanyikanlah Kidung Baru"],
  };

  try {
    let data = await axios.get(
      `https://alkitab.mobi/kidung/${versionKey}/${id}`
    );
    let htmlData = data.data;

    let $ = cheerio.load(htmlData);
    let a = $("p.paragraphtitle");
    let cc = a.nextUntil("hr");

    let title;

    if (versionKey === "kj") {
      title = $("title")
        .text()
        .replace(/KJ\s([0-9]{1,3}\s-\s)/, "");
    } else if (versionKey === "pkj") {
      title = $("title")
        .text()
        .replace(/PKJ\s([0-9]{1,3}\s-\s)/, "");
    } else {
      title = $("title")
        .text()
        .replace(/NKB\s([0-9]{1,3}\s-\s)/, "");
    }

    let idNumber = parseInt(id) || 0;

    let song = {
      source: songversion[versionKey][0],
      id: idNumber,
      title: "",
      lyrics: [],
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
