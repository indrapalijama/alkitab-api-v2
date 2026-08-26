const axios = require("axios");
const cheerio = require("cheerio");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

        let isHistorical = false;
        if (dateParam) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
            }
            isHistorical = true;
        } else {
            // For latest, we should determine today's date in GMT+7 (or typical Indonesia time) to use as cache key for R2
            // Actually, we can just use "latest" as the date part for the cache key, but it changes daily.
        }

        const s3Key = isHistorical 
            ? `reflections/${dateParam}/${versionKey}.json`
            : `reflections/latest/${versionKey}.json`;

        // 1. Try to fetch from R2 first
        if (process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME) {
            try {
                const getCmd = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: s3Key,
                });
                // To read the JSON from S3, we can use the stream
                const r2Response = await r2Client.send(getCmd);
                const streamToString = (stream) =>
                    new Promise((resolve, reject) => {
                        const chunks = [];
                        stream.on("data", (chunk) => chunks.push(chunk));
                        stream.on("error", reject);
                        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
                    });
                const r2Data = await streamToString(r2Response.Body);
                return res.status(200).json(JSON.parse(r2Data));
            } catch (err) {
                // Not found or error, proceed to scrape
                console.log("R2 cache miss or error:", err.name);
            }
        }

        // 2. Scrape from alkitab.mobi
        let fetchUrl = versionData.url;
        if (isHistorical) {
            const [year, month, day] = dateParam.split('-');
            fetchUrl = `${fetchUrl}/${year}/${month}/${day}/`;
        }

        const { data } = await axios.get(fetchUrl);
        const $ = cheerio.load(data);

        const title = [];
        const body = [];
        const passage = [];
        const date = [];
        const intro = [];

        $("div").each((i, el) => {
            const elData = $(el);
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

        const filteredTitle = title.filter((el) => el !== "");
        const filteredBody = body.filter((el) => el !== undefined && el !== "");
        let filteredPassage = passage.filter((el) => el !== undefined && el !== "");
        
        if (!filteredBody || filteredBody.length === 0 || !filteredTitle || filteredTitle.length === 0) {
            return res.status(404).json({ error: "Content not found for the requested date." });
        }

        let content = filteredBody[0].split("* * *")[0];

        if (versionKey === "roc") {
            content = content.replace("Renungan:", "").trim();
        } else if (versionKey === "rh") {
            content = content.split(" --")[0];
        }

        const responseData = {
            Source: versionData.name,
            Title: filteredTitle[0],
            Date: dateParam ? dateParam : new Date().toISOString(),
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

        // 3. Cache to R2
        if (process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME) {
            try {
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
