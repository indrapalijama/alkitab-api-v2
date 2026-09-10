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
                    const match = link.match(regex);
                    if (match) {
                        songs.push({ source: name, id: match[0], title });
                    }
                }
            } else if (versionKey === "pkj") {
                if (text.includes("PKJ ")) {
                    const title = text.split("-")[1].trim();
                    const link = element.attribs.href;
                    const match = link.match(regex);
                    if (match) {
                        songs.push({ source: name, id: match[0], title });
                    }
                }
            } else {
                if (text.includes("KJ ")) {
                    const title = text.split("-")[1].trim();
                    const link = element.attribs.href;
                    const match = link.match(regex);
                    if (match) {
                        songs.push({ source: name, id: match[0], title });
                    }
                }
            }
        });
        
        // Cache song list since it never changes
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json(songs);
    } catch (error) {
        console.error("Song getList error:", error.message);
        res.status(500).json({
            error: "An error occurred while fetching the song list",
        });
    }
};

const cleanContent = (text) => {
    if (!text) return "";
    let s = text;
    // Replace tabs with space
    s = s.replace(/\t/g, " ");
    // Fix known typo like t,rang -> t'rang
    s = s.replace(/\b([stbkg])\,([a-z]+)/gi, "$1'$2");
    // Fix punctuation immediately followed by letter: add space
    s = s.replace(/([,;:!?])([a-zA-Z])/g, "$1 $2");
    // Trim lines and collapse excessive whitespace within lines
    const lines = s.split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).filter(l => l.length > 0);
    return lines.join("\n");
};

const sanitizeCheerioElement = ($, e) => {
    $(e).find("br").replaceWith("\n");
    let t = $(e).text();
    let b = t.split("\n");

    return b
        .map((v) => v.trim())
        .filter((v) => v !== "" && v !== "Play");
};

const convertToSongStruct = (a) => {
    const firstLine = a[0];
    const isReff = /^Reff:?$/i.test(firstLine);
    let contentLines;
    if (isReff) {
        contentLines = a.slice(1);
    } else if (/^\d+\.?$/.test(firstLine)) {
        contentLines = a.slice(1);
    } else {
        contentLines = a;
    }

    const content = cleanContent(contentLines.join("\n"));
    return {
        element: isReff ? "reff" : "verse",
        content: content,
    };
};

const linesAreVariantHeader = (b) => {
    return b.length === 1 && /^(KJ|PKJ|NKB)\s*\d+[a-z]?$/i.test(b[0]);
};

const getSongData = async (req, res) => {
    const id = req.params.id;
    const versionKey = req.params.source.toLowerCase();

    const songversion = {
        kj: ["Kidung Jemaat"],
        pkj: ["Pelengkap Kidung Jemaat"],
        nkb: ["Nyanyian Kidung Baru"],
    };
    
    if (!songversion[versionKey]) {
        return res.status(400).json({ error: "Invalid version" });
    }

    try {
        let { data: htmlData } = await axios.get(
            `https://alkitab.mobi/kidung/${versionKey}/${id}`
        );

        let $ = cheerio.load(htmlData);
        let a = $("p.paragraphtitle");
        let cc = a.nextUntil("hr");

        let title;

        if (versionKey === "kj") {
            title = $("title").text().replace(/KJ\s([0-9]{1,3}\s-\s)/, "");
        } else if (versionKey === "pkj") {
            title = $("title").text().replace(/PKJ\s([0-9]{1,3}\s-\s)/, "");
        } else {
            title = $("title").text().replace(/NKB\s([0-9]{1,3}\s-\s)/, "");
        }

        let idNumber = parseInt(id) || 0;

        let song = {
            source: songversion[versionKey][0],
            id: idNumber,
            title: title.trim(),
            lyrics: [],
        };

        cc.each((_, v) => {
            $(v).each((_, e) => {
                let b = sanitizeCheerioElement($, e);

                if (b.length > 0) {
                    // Skip variant header like "KJ 24a", "NKB 30b"
                    if (linesAreVariantHeader(b)) {
                        return;
                    }
                    let ss = convertToSongStruct(b);
                    if (ss.content.length > 0) {
                        song.lyrics.push(ss);
                    }
                }
            });
        });

        // Cache individual song since lyrics never change
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800');
        res.status(200).json(song);
    } catch (error) {
        console.error("Song getSongData error:", error.message);
        res.status(500).json({
            error: "An error occurred while fetching song lyrics",
        });
    }
};

module.exports = {
    getList,
    getSongData,
};
