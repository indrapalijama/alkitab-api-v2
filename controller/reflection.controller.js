const axios = require("axios");
const cheerio = require("cheerio");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// R2 Client configuration
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

const get = async (req, res) => {
    // Basic backward compatibility for /reflection which acts like /reflection/sh
    req.params.version = 'sh';
    return getCustom(req, res);
};

const getCustom = async (req, res) => {
    try {
        const versionKey = req.params.version;
        let dateParam = req.query.date; // Expecting YYYY-MM-DD

        const versionMapping = {
            sh: { url: "https://alkitab.mobi/renungan/sh", name: "Santapan Harian" },
            rh: { url: "https://alkitab.mobi/renungan/rh", name: "Renungan Harian" },
            roc: { url: "https://alkitab.mobi/renungan/roc", name: "Renungan Oswald Chambers" },
        };

        const versionData = versionMapping[versionKey];
        if (!versionData) {
            return res.status(400).json({ error: "Invalid version" });
        }

        let fetchUrl = versionData.url;
        let isHistorical = false;

        if (dateParam) {
            // Validate date format YYYY-MM-DD
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
            }
            const [year, month, day] = dateParam.split('-');
            fetchUrl = `${fetchUrl}/${year}/${month}/${day}/`;
            isHistorical = true;
        }

        const { data } = await axios.get(fetchUrl);
        const $ = cheerio.load(data);

        const title = [];
        const body = [];
        const passage = [];
        const date = [];
        const intro = [];

        // Begin cheerio scraping
        $("div").each((i, el) => {
            const elData = $(el);
            // Extract title and date
            const strong = elData.find("strong").first().text();
            title.push(strong);
            date.push(elData.find("span").first().text());

            if (versionKey === "roc") {
                const renunganDiv = elData.children("div").text();
                if (renunganDiv) {
                    const introP = elData.children("p").filter((j, p) => $(p).text().includes("Intro:")).text().replace("Intro:", "").trim();
                    intro.push(introP);

                    const pText = elData.find("p").text();
                    const strongIndex = pText.indexOf(strong);
                    passage.push(strongIndex !== -1 && strong !== "" ? pText.substring(0, strongIndex) : pText);

                    body.push(renunganDiv);
                }
            } else {
                const pText = elData.find("p").text();
                const strongIndex = pText.indexOf(strong);
                if (strongIndex !== -1 && strong !== "") {
                    passage.push(pText.substring(0, strongIndex));
                    body.push(pText.substring(strongIndex + strong.length));
                } else {
                    passage.push(pText);
                    body.push("");
                }
            }
        });

        // Filter out undefined or empty string values
        const filteredTitle = title.filter((el) => el !== "");
        const filteredBody = body.filter((el) => el !== undefined && el !== "");
        let filteredPassage = passage.filter((el) => el !== undefined && el !== "");
        
        if (!filteredBody || filteredBody.length === 0 || !filteredTitle || filteredTitle.length === 0) {
            return res.status(404).json({ error: "Content not found for the requested date." });
        }

        let content = filteredBody[0].split("* * *")[0];

        // modify content for specific version
        if (versionKey === "roc") {
            content = content.replace("Renungan:", "").trim();
        } else if (versionKey === "rh") {
            content = content.split(" --")[0];
        }

        const responseData = {
            Source: versionData.name,
            Title: filteredTitle[0],
            Date: dateParam ? dateParam : new Date().toISOString(), // Use requested date or current time
            Passage:
                versionKey === "sh"
                    ? (filteredPassage[0] && filteredPassage[0].includes("Bacaan:") ? filteredPassage[0].split("Bacaan:")[1].trim() : filteredPassage[0])
                    : (filteredPassage[0] && filteredPassage[0].includes("Bacaan:") ? removeWordsAfterNumber(filteredPassage[0].split("Bacaan:")[1].trim()) : filteredPassage[0]),
            Content: content,
        };

        if (versionKey === "roc") {
            const filteredIntro = intro.filter((el) => el !== undefined && el !== "");
            responseData.Intro = filteredIntro[0];
        }

        // --- CACHE TO R2 LOGIC ---
        if (process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME) {
            try {
                // R2 Key: reflections/2023-10-25/sh.json
                const s3Key = isHistorical 
                    ? `reflections/${dateParam}/${versionKey}.json`
                    : `reflections/latest/${versionKey}.json`;
                
                await r2Client.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: s3Key,
                    Body: JSON.stringify(responseData),
                    ContentType: "application/json",
                    CacheControl: isHistorical ? "public, max-age=31536000, immutable" : "public, max-age=3600"
                }));
            } catch (s3Error) {
                console.error("Failed to upload to R2:", s3Error);
            }
        }

        // Return the data
        res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "An error occurred while fetching and processing the data.",
        });
    }
};

function removeWordsAfterNumber(words) {
    if (!words) return words;
    let result = words;
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
