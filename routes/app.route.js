const express = require('express');
const router = express.Router();

router.get('/version', async (req, res) => {
  try {
    const appId = req.query.appId || 'fulk.evilcorp.dailyreflection';
    
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

    // 2. Try fetching latest Play Store version
    let latestVersionName = "1.0.0";
    let url = `https://play.google.com/store/apps/details?id=${appId}`;
    try {
      const gplay = await import('google-play-scraper');
      const app = await gplay.default.app({ appId });
      latestVersionName = app.version || latestVersionName;
      url = app.url || url;
    } catch (playError) {
      console.error("Error fetching from Play Store (could be rate limit):", playError);
      // We continue since we still have the minVersionCode
    }
    
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200");
    res.json({
      latestVersionName,
      url,
      forceUpdate: false,
      minVersionCode
    });
  } catch (error) {
    console.error("Fatal error in app version route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
