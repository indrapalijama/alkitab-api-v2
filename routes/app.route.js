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
      if (configRes.ok) {
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
    try {
      const gplay = await import('google-play-scraper');
      const app = await gplay.default.app({ appId, lang, country });
      latestVersionName = app.version || latestVersionName;
      url = app.url || url;
      if (app.recentChanges) {
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
    
    // Cache for 15 minutes (900 seconds)
    res.setHeader("Cache-Control", "public, max-age=900, s-maxage=900, stale-while-revalidate=1800");
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
