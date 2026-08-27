const express = require('express');
const router = express.Router();

router.get('/version', async (req, res) => {
  try {
    const appId = req.query.appId || 'fulk.evilcorp.dailyreflection';
    // google-play-scraper is ESM-only, must use dynamic import() in CommonJS
    const gplay = await import('google-play-scraper');
    const app = await gplay.default.app({ appId });
    
    // Fetch config from R2 for minVersionCode
    let minVersionCode = 0;
    try {
      // Node 18+ has native fetch()
      const configRes = await fetch("https://pub-9e4f37fb34284aad81e4b9c7a8285ee9.r2.dev/config/app.json");
      if (configRes.ok) {
        const config = await configRes.json();
        minVersionCode = config.minVersionCode || 0;
      }
    } catch (e) {
      console.error("Failed to fetch config from R2:", e);
    }
    
    res.json({
      latestVersionName: app.version,
      url: app.url,
      forceUpdate: false,
      minVersionCode: minVersionCode
    });
  } catch (error) {
    console.error("Error fetching app version:", error);
    // Fallback if not found on play store yet
    res.json({
      latestVersionName: "1.0.0",
      url: `https://play.google.com/store/apps/details?id=fulk.evilcorp.dailyreflection`,
      forceUpdate: false,
      minVersionCode: 0
    });
  }
});

module.exports = router;
