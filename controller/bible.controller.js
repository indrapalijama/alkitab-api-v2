const axios = require("axios");
const cheerio = require("cheerio");

//get chapter metadata
const find = async (req, res) => {
  var book = req.params.book;
  if (req.params.book.length > 3) {
    book = req.params.book.substring(0, 3);
  }
  book = book.charAt(0).toUpperCase() + book.slice(1);
  const url = "https://alkitab.mobi/tb/" + book;
  axios.get(url).then(
    ({ data }) => {
      let $ = cheerio.load(data);
      let href = [];
      $("a").filter((i, el) => {
        let data = $(el);
        href.push(data.attr("href"));
      });
      let match = [];
      let verses = [];
      href.forEach((element) => {
        var string2 = book;
        var regex = new RegExp(string2, "g");
        if (element.match(regex)) {
          match.push(element);
        }
      });
      match.forEach((element) => {
        if (element.match(/\d+/g)) {
          verses.push(parseInt(element.match(/\d+/g)));
        }
      });
      res.status(200).json({
        book: book,
        total_verse: verses.length,
        verses: verses,
      });
    },
    (error) => {
      res.status(500).json({
        error: error.message,
      });
    }
  );
};

//read bible with params (book, chapter, version)
const read = async (req, res) => {
  var book = req.params.book;
  var chapter = req.params.chapter;
  var version = req.params.version == undefined ? "tb" : req.params.version;

  if (req.params.book.length > 3) {
    book = req.params.book.substring(0, 3);
  }

  const url = "https://alkitab.mobi/" + version + "/" + book + "/" + chapter;

  axios.get(url).then(
    ({ data }) => {
      let $ = cheerio.load(data);
      book = $("title")
        .text()
        .match(/[a-zA-Z]+/g);
      chapter = parseInt($("title").text().match(/\d+/g));
      let items = [];

      $("p").filter((i, el) => {
        let data = $(el);
        let lastVerse = 0;
        let content = data.find("[data-begin]").first().text();
        let title = data.find(".paragraphtitle").first().text();
        let verse = data.find(".reftext").children().first().text();

        let type = null;
        let item = {};

        if (!verse) {
          verse = 0;
        } else {
          verse = parseInt(verse, 10);
        }

        if (!title && !content) {
          data.find(".reftext").remove();
          content = data.text();
        }

        if (title) {
          type = "title";
          content = title;
          verse = lastVerse + 1;
        } else if (content) {
          type = "content";
          lastVerse = verse;
        }

        if (
          data.attr("hidden") === "hidden" ||
          data.hasClass("loading") ||
          data.hasClass("error")
        ) {
          type = null;
        }

        if (type) {
          item = {
            verse,
            content,
          };
          items.push(item);
        }
        return item;
      });

      let result = items;
      result = result.filter((obj) => obj.verse !== 0);
      res.status(200).json({
        verses: result,
        book,
        chapter,
      });
    },
    (error) => {
      res.status(500).json({
        error: error.message,
      });
    }
  );
};

module.exports = {
  find,
  read,
};
