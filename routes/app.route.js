const express = require('express');
const router = express.Router();

router.get('/version', async (req, res) => {
  try {
    const appId = req.query.appId || 'fulk.evilcorp.dailyreflection';
    const lang = req.query.lang || 'id';
    const country = req.query.country || (lang === 'en' ? 'us' : 'id');
    
    // 1. Fetch config from R2 for minVersionCode independently
    let minVersionCode = 0;
    try {
      const configRes = await fetch("https://pub-9e4f37fb34284aad81e4b9c7a8285ee9.r2.dev/config/app.json");
      const contentType = configRes.headers.get("content-type") || "";
      if (configRes.ok && contentType.includes("application/json")) {
        const config = await configRes.json();
        minVersionCode = config.minVersionCode || 0;
      }
    } catch (e) {
      console.error("Failed to fetch config from R2:", e);
    }

    // 2. Try fetching latest Play Store version and What's New
    let latestVersionName = "1.0.0";
    let url = `https://play.google.com/store/apps/details?id=${appId}`;
    let recentChanges = null;
    let fetchSuccess = false;
    try {
      const gplay = await import('google-play-scraper');
      const app = await gplay.default.app({ appId, lang, country });
      if (app && app.version) {
        latestVersionName = app.version;
        fetchSuccess = true;
      }
      url = app?.url || url;
      if (app?.recentChanges) {
        recentChanges = app.recentChanges
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;|&apos;|&#x27;/gi, "'")
          .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
          .replace(/&#x([0-9a-fA-F]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
          .trim();
      }
    } catch (playError) {
      console.error("Error fetching from Play Store (could be rate limit):", playError);
      // We continue since we still have the minVersionCode
    }
    
    // Set cache: 5 minutes if successful, never cache failures/rate-limits
    if (fetchSuccess && latestVersionName !== "1.0.0") {
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    res.json({
      latestVersionName,
      url,
      forceUpdate: false,
      minVersionCode,
      recentChanges
    });
  } catch (error) {
    console.error("Fatal error in app version route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
