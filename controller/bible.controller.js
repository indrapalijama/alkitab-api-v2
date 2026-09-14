const axios = require("axios");
const cheerio = require("cheerio");

//get chapter metadata
const find = async (req, res) => {
    try {
        let book = req.params.book;
        if (book.length > 3) {
            book = book.substring(0, 3);
        }
        book = book.charAt(0).toUpperCase() + book.slice(1);
        
        const url = "https://alkitab.mobi/tb/" + book;
        const { data } = await axios.get(url);
        
        let $ = cheerio.load(data);
        let href = [];
        
        $("a").each((i, el) => {
            let data = $(el);
            href.push(data.attr("href"));
        });
        
        let verses = [];
        const regex = new RegExp(`https://alkitab\\.mobi/tb/${book}/(\\d+)`, 'i');
        
        href.forEach((element) => {
            if (element) {
                const matchResult = element.match(regex);
                if (matchResult) {
                    verses.push(parseInt(matchResult[1]));
                }
            }
        });
        
        // Cache this forever at the edge since the number of chapters in a book never changes
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json({
            book: book,
            total_verse: verses.length,
            verses: verses,
        });
    } catch (error) {
        console.error("Bible find error:", error.message);
        res.status(500).json({ error: "Failed to fetch book metadata" });
    }
};

//read bible with params (book, chapter, version)
const read = async (req, res) => {
    try {
        let book = req.params.book;
        let chapter = req.params.chapter;
        let version = req.params.version == undefined ? "tb" : req.params.version;

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

        if (book.length > 3) {
            book = book.substring(0, 3);
        }

        const url = "https://alkitab.mobi/" + version + "/" + book + "/" + chapter;
        const { data } = await axios.get(url);
        
        let $ = cheerio.load(data);
        book = $("title").text().match(/[a-zA-Z]+/g);
        // Safely extract chapter number
        const chapterMatch = $("title").text().match(/\\d+/g);
        chapter = chapterMatch ? parseInt(chapterMatch[0]) : parseInt(chapter);
        
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

            if (content && version && version.toLowerCase() === 'kjv') {
                content = content
                    .replace(/\{[^}]*\}/g, "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\(\d+\)/g, "")
                    .replace(/_([,.:;?!])/g, "$1")
                    .replace(/_/g, "")
                    .replace(/\[(.*?)\]/g, "$1")
                    .replace(/\s+([,.:;?!])/g, "$1")
                    .replace(/\s{2,}/g, " ")
                    .trim();
            }

            if (
                data.attr("hidden") === "hidden" ||
                data.hasClass("loading") ||
                data.hasClass("error")
            ) {
                type = null;
            }

            if (type === "title") {
                item = { type, content };
                items.push(item);
            } else if (type === "content") {
                item = { verse, content, type };
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

        // Cache this forever at the edge since the bible text never changes
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json(responsePayload);
        
    } catch (error) {
        console.error("Bible read error:", error.message);
        res.status(500).json({ error: "Failed to fetch bible content" });
    }
};

const BIBLE_BOOKS_MAP = {
    // Perjanjian Lama (39 books)
    kej: { name: "Kejadian", testament: "PL" },
    kel: { name: "Keluaran", testament: "PL" },
    ima: { name: "Imamat", testament: "PL" },
    bil: { name: "Bilangan", testament: "PL" },
    ula: { name: "Ulangan", testament: "PL" },
    yos: { name: "Yosua", testament: "PL" },
    hak: { name: "Hakim-hakim", testament: "PL" },
    rut: { name: "Rut", testament: "PL" },
    "1sa": { name: "1 Samuel", testament: "PL" },
    "2sa": { name: "2 Samuel", testament: "PL" },
    "1ra": { name: "1 Raja-raja", testament: "PL" },
    "2ra": { name: "2 Raja-raja", testament: "PL" },
    "1ta": { name: "1 Tawarikh", testament: "PL" },
    "2ta": { name: "2 Tawarikh", testament: "PL" },
    ezr: { name: "Ezra", testament: "PL" },
    neh: { name: "Nehemia", testament: "PL" },
    est: { name: "Ester", testament: "PL" },
    ayb: { name: "Ayub", testament: "PL" },
    maz: { name: "Mazmur", testament: "PL" },
    ams: { name: "Amsal", testament: "PL" },
    pkh: { name: "Pengkhotbah", testament: "PL" },
    kid: { name: "Kidung Agung", testament: "PL" },
    yes: { name: "Yesaya", testament: "PL" },
    yer: { name: "Yeremia", testament: "PL" },
    rat: { name: "Ratapan", testament: "PL" },
    yeh: { name: "Yehezkiel", testament: "PL" },
    dan: { name: "Daniel", testament: "PL" },
    hos: { name: "Hosea", testament: "PL" },
    yoe: { name: "Yoel", testament: "PL" },
    amo: { name: "Amos", testament: "PL" },
    oba: { name: "Obaja", testament: "PL" },
    yun: { name: "Yunus", testament: "PL" },
    mik: { name: "Mikha", testament: "PL" },
    nah: { name: "Nahum", testament: "PL" },
    hab: { name: "Habakuk", testament: "PL" },
    zef: { name: "Zefanya", testament: "PL" },
    hag: { name: "Hagai", testament: "PL" },
    zak: { name: "Zakharia", testament: "PL" },
    mal: { name: "Maleakhi", testament: "PL" },

    // Perjanjian Baru (27 books)
    mat: { name: "Matius", testament: "PB" },
    mrk: { name: "Markus", testament: "PB" },
    luk: { name: "Lukas", testament: "PB" },
    yoh: { name: "Yohanes", testament: "PB" },
    kis: { name: "Kisah Para Rasul", testament: "PB" },
    rom: { name: "Roma", testament: "PB" },
    "1ko": { name: "1 Korintus", testament: "PB" },
    "2ko": { name: "2 Korintus", testament: "PB" },
    gal: { name: "Galatia", testament: "PB" },
    efe: { name: "Efesus", testament: "PB" },
    flp: { name: "Filipi", testament: "PB" },
    kol: { name: "Kolose", testament: "PB" },
    "1te": { name: "1 Tesalonika", testament: "PB" },
    "2te": { name: "2 Tesalonika", testament: "PB" },
    "1ti": { name: "1 Timotius", testament: "PB" },
    "2ti": { name: "2 Timotius", testament: "PB" },
    tit: { name: "Titus", testament: "PB" },
    flm: { name: "Filemon", testament: "PB" },
    ibr: { name: "Ibrani", testament: "PB" },
    yak: { name: "Yakobus", testament: "PB" },
    "1pe": { name: "1 Petrus", testament: "PB" },
    "2pe": { name: "2 Petrus", testament: "PB" },
    "1yo": { name: "1 Yohanes", testament: "PB" },
    "2yo": { name: "2 Yohanes", testament: "PB" },
    "3yo": { name: "3 Yohanes", testament: "PB" },
    yud: { name: "Yudas", testament: "PB" },
    why: { name: "Wahyu", testament: "PB" }
};

// get all bible versions/languages list
const getVersions = async (req, res) => {
    try {
        const url = "https://alkitab.mobi/tb/versions/";
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const categories = [];
        let totalVersionsCount = 0;

        const filterCategory = req.query.category ? req.query.category.toLowerCase().trim() : null;
        const filterSearch = req.query.search ? req.query.search.toLowerCase().trim() : null;

        $("p").each((i, el) => {
            const titleSpan = $(el).find(".style3").text().trim();
            if (titleSpan) {
                const categoryName = titleSpan.replace(/^Versi\s*/i, "").replace(/:$/, "").trim();
                if (filterCategory && !categoryName.toLowerCase().includes(filterCategory)) {
                    return;
                }

                const versions = [];
                $(el).find("a").each((j, aEl) => {
                    const href = $(aEl).attr("href") || "";
                    const match = href.match(/\/([a-zA-Z0-9_-]+)\/?$/);
                    const code = match ? match[1] : "";
                    const name = $(aEl).text().trim();
                    const rawTextAfter = $(aEl)[0].nextSibling ? $(aEl)[0].nextSibling.nodeValue : "";
                    const isNewTestamentOnly = name.endsWith("*") || (rawTextAfter && rawTextAfter.includes("*")) || false;
                    const cleanName = name.replace(/\*$/, "").trim();

                    if (code) {
                        if (filterSearch && !code.toLowerCase().includes(filterSearch) && !cleanName.toLowerCase().includes(filterSearch)) {
                            return;
                        }
                        versions.push({
                            code,
                            name: cleanName,
                            is_new_testament_only: Boolean(isNewTestamentOnly),
                        });
                    }
                });

                if (versions.length > 0) {
                    totalVersionsCount += versions.length;
                    categories.push({
                        category: categoryName,
                        total: versions.length,
                        versions,
                    });
                }
            }
        });

        // Cache for 24h on browser, 1 year on CDN edge
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json({
            total: totalVersionsCount,
            categories,
        });
    } catch (error) {
        console.error("Bible getVersions error:", error.message);
        res.status(500).json({ error: "Failed to fetch bible versions" });
    }
};

// get bible version detail (books, testaments, copyright)
const getVersionDetail = async (req, res) => {
    try {
        const version = req.params.version;
        if (!version) {
            return res.status(400).json({ error: "Version parameter is required" });
        }

        const normVersion = version.toLowerCase().trim();
        const [versionRes, copyrightRes] = await Promise.all([
            axios.get(`https://alkitab.mobi/${normVersion}/`),
            axios.get("https://alkitab.mobi/copyright/").catch(() => null)
        ]);

        const $v = cheerio.load(versionRes.data);
        const title = $v("title").text().trim();

        // Check if version was valid or silently fell back to TB
        const titleVersionMatch = title.match(/\(([^)]+)\)/);
        const detectedVersionInTitle = titleVersionMatch ? titleVersionMatch[1].toLowerCase() : "";
        if (normVersion !== "tb" && detectedVersionInTitle === "tb") {
            return res.status(404).json({ error: `Bible version '${normVersion}' not found` });
        }

        const books = [];
        $v("a").each((i, el) => {
            const href = $v(el).attr("href") || "";
            const regex = new RegExp(`^https://alkitab\\.mobi/${normVersion}/([a-zA-Z0-9_-]+)/$`, "i");
            const match = href.match(regex);
            if (match) {
                const bookId = match[1];
                const abbr = $v(el).text().trim();
                const lowerId = bookId.toLowerCase();
                if (!["versions", "pl", "pb"].includes(lowerId) && !books.some((b) => b.id.toLowerCase() === lowerId)) {
                    const mapped = BIBLE_BOOKS_MAP[lowerId];
                    books.push({
                        id: bookId,
                        abbr: abbr || bookId,
                        name: mapped ? mapped.name : abbr || bookId,
                        testament: mapped ? mapped.testament : null,
                    });
                }
            }
        });

        const hasOldTestament = books.some((b) => b.testament === "PL");
        const hasNewTestament = books.some((b) => b.testament === "PB");

        let copyright = null;
        if (copyrightRes && copyrightRes.data) {
            const $c = cheerio.load(copyrightRes.data);
            const anchor = $c(`a[name="${normVersion}"], a[name="${normVersion.toUpperCase()}"]`);
            if (anchor.length > 0) {
                let next = anchor.next();
                let texts = [];
                while (next.length && !next.is("a[name]") && !next.find("a[name]").length && !next.is("hr")) {
                    const t = next.text().trim();
                    if (t) texts.push(t);
                    next = next.next();
                }
                if (texts.length > 0) {
                    copyright = {
                        title: texts[0],
                        description: texts.slice(1).join("\n\n") || texts[0],
                    };
                }
            }
        }

        const versionName = copyright?.title || title.replace(/^Alkitab Mobile SABDA\s*/i, "").replace(/[()]/g, "").trim() || normVersion.toUpperCase();

        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json({
            code: normVersion,
            name: versionName,
            has_old_testament: hasOldTestament,
            has_new_testament: hasNewTestament,
            total_books: books.length,
            copyright,
            books,
        });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: `Bible version '${req.params.version}' not found` });
        }
        console.error("Bible getVersionDetail error:", error.message);
        res.status(500).json({ error: "Failed to fetch bible version details" });
    }
};

module.exports = {
    find,
    read,
    getVersions,
    getVersionDetail,
};
