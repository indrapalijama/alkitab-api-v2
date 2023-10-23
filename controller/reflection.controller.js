const axios = require("axios");
const cheerio = require("cheerio");

const get = async (req, res) => {
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
};

const getCustom = async (req, res) => {
  let url;
  let version;
  if (req.params.version === "sh") {
    url = "https://alkitab.mobi/renungan/sh";
    version = "Santapan Harian";
  } else {
    url = "https://alkitab.mobi/renungan/rh";
    version = "Renungan Harian";
  }
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
      Source: version,
      Title: filteredTitle[0],
      Date: filteredTanggal[2],
      Passage: filteredPassage[0].split("Bacaan:")[1].trim(),
      Content: content,
    });
  });
};

module.exports = {
  get,
  getCustom,
};
