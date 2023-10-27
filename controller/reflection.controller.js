const axios = require("axios");
const cheerio = require("cheerio");

const get = async (req, res) => {
  try {
    const url = "https://alkitab.mobi/renungan/sh";
    axios.get(url).then(({ data }) => {
      let $ = cheerio.load(data);
      var title = [];
      var body = [];
      var passage = [];
      var date = [];

      //begin cheerio scrapping
      $("div").filter((i, el) => {
        let data = $(el);
        let strong = data.find("strong").first().text();
        title.push(strong);
        date.push(data.find("span").first().text());
        passage.push(data.find("p").text().split(strong)[0]);
        body.push(data.find("p").text().split(strong)[1]);
      });

      //filter out the undefined or empty string values
      var filteredTitle = title.filter(function (el) {
        return el != "";
      });
      var filteredBody = body.filter(function (el) {
        return el != undefined;
      });
      var filteredPassage = passage.filter(function (el) {
        return el != undefined;
      });
      var content = filteredBody[0].split("* * *")[0];
      var tempFiltered = date.filter(function (el) {
        return el != undefined;
      });
      var filteredTanggal = tempFiltered.filter(function (el) {
        return el != "";
      });

      //return the data back
      res.status(200).json({
        Source: "Santapan Harian",
        Title: filteredTitle[0],
        Date: filteredTanggal[2],
        Passage: filteredPassage[0].split("Bacaan:")[1].trim(),
        Content: content,
      });
    });
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching the data (${error})`,
    });
  }
};

const getCustom = async (req, res) => {
  try {
    const versionMapping = {
      sh: { url: "https://alkitab.mobi/renungan/sh", name: "Santapan Harian" },
      rh: { url: "https://alkitab.mobi/renungan/rh", name: "Renungan Harian" },
      roc: {
        url: "https://alkitab.mobi/renungan/roc",
        name: "Renungan Oswald Chambers",
      },
    };

    const versionKey = req.params.version;
    const versionData = versionMapping[versionKey];

    if (!versionData) {
      return res.status(400).json({ error: "Invalid version" });
    }

    const { url, name: version } = versionData;

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = [];
    const body = [];
    const passage = [];
    const date = [];

    // Begin cheerio scraping
    $("div").each((i, el) => {
      const data = $(el);
      const strong = data.find("strong").first().text();
      title.push(strong);
      date.push(data.find("span").first().text());
      const passageAndBody = data.find("p").text().split(strong);
      passage.push(passageAndBody[0]);
      body.push(passageAndBody[1]);
    });

    // Filter out undefined or empty string values
    const filteredTitle = title.filter((el) => el !== "");
    const filteredBody = body.filter((el) => el !== undefined);
    let filteredPassage = passage.filter((el) => el !== undefined);
    let content = filteredBody[0].split("* * *")[0];

    // modify content for specific version
    if (versionKey === "roc") {
      content = content.split("Intro:")[1];
      content = content.trim();
    } else if (versionKey === "rh") {
      content = content.split(" --")[0];
    }

    const tempFiltered = date.filter((el) => el !== undefined);
    const filteredTanggal = tempFiltered.filter((el) => el !== "");

    // Return the data
    res.status(200).json({
      Source: version,
      Title: filteredTitle[0],
      Date: filteredTanggal[2],
      Passage:
        versionKey === "sh"
          ? filteredPassage[0].split("Bacaan:")[1].trim()
          : removeWordsAfterNumber(
              filteredPassage[0].split("Bacaan:")[1].trim()
            ),
      Content: content,
    });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching and processing the data.",
    });
  }
};

function removeWordsAfterNumber(words) {
  let result;
  const match = words.match(/\(([^)]+)\)/);
  if (match) {
    result = match[1];
  }
  return result;
}

module.exports = {
  get,
  getCustom,
};
