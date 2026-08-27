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

const sanitizeCheerioElement = ($, e) => {
    let t = $(e).text();
    let b = t.split("\n");

    return b
        .filter((v) => v !== "")
        .map((v) => v.trim())
        .filter((v) => v !== "" && v !== "Play");
};

const convertToSongStruct = (a) => {
    const isReff = a[0] === "Reff:";
    return {
        element: isReff ? "reff" : "verse",
        content: a.slice(1).join("\n"),
    };
};

const getSongData = async (req, res) => {
    const id = req.params.id;
    const versionKey = req.params.source.toLowerCase();

    const songversion = {
        kj: ["Kidung Jemaat"],
        pkj: ["Pelengkap Kidung Jemaat"],
        nkb: ["Nyanyikanlah Kidung Baru"],
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
                    let ss = convertToSongStruct(b);
                    song.lyrics.push(ss);
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
