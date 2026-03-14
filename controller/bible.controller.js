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
                var regex = new RegExp(`https://alkitab.mobi/tb/${book}/(\\d+)`);
                var matchResult = element.match(regex);

                if (matchResult) {
                    verses.push(parseInt(matchResult[1]));
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

    let requestedVerses = [];
    let requestedVersesStr = null;
    if (typeof chapter === "string" && chapter.includes(":")) {
        const parts = chapter.split(":");
        chapter = parts[0];
        const versePart = parts[1];
        requestedVersesStr = versePart;

        if (versePart.includes("-")) {
            const [start, end] = versePart.split("-").map(Number);
            for (let i = start; i <= end; i++) {
                requestedVerses.push(i);
            }
        } else if (versePart.includes(",")) {
            requestedVerses = versePart.split(",").map(Number);
        } else {
            requestedVerses.push(Number(versePart));
        }
    }

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

            let lastVerse = 0;
            $("p").each((i, el) => {
                let data = $(el);
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

                if (type === "title") {
                    item = {
                        type,
                        content,
                    };
                    items.push(item);
                } else if (type === "content") {
                    item = {
                        verse,
                        content,
                        type,
                    };
                    items.push(item);
                }
            });

            let result = items;

            if (requestedVerses.length > 0) {
                let filteredResult = [];
                let lastTitle = null;
                for (let i = 0; i < result.length; i++) {
                    let obj = result[i];
                    if (obj.type === "title") {
                        lastTitle = obj;
                    } else if (obj.type === "content" && obj.verse !== 0) {
                        if (requestedVerses.includes(obj.verse)) {
                            if (lastTitle && !filteredResult.includes(lastTitle)) {
                                filteredResult.push(lastTitle);
                            }
                            filteredResult.push(obj);
                        }
                    }
                }
                result = filteredResult;
            } else {
                result = result.filter(
                    (obj) => obj.type === "title" || (obj.type === "content" && obj.verse !== 0)
                );
            }

            let responsePayload = {
                verses: result,
                book: book,
                chapter: chapter,
            };
            if (requestedVersesStr) {
                responsePayload.verse = requestedVersesStr;
            }

            res.status(200).json(responsePayload);
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
