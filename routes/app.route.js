const express = require('express');
const router = express.Router();

router.get('/version', async (req, res) => {
  try {
    const appId = req.query.appId || 'fulk.evilcorp.dailyreflection';
    // google-play-scraper is ESM-only, must use dynamic import() in CommonJS
    const gplay = await import('google-play-scraper');
    const app = await gplay.default.app({ appId });
    
    res.json({
      latestVersionName: app.version,
      url: app.url,
      forceUpdate: false
    });
  } catch (error) {
    console.error("Error fetching app version:", error);
    // Fallback if not found on play store yet
    res.json({
      latestVersionName: "1.0.0",
      url: `https://play.google.com/store/apps/details?id=fulk.evilcorp.dailyreflection`,
      forceUpdate: false
    });
  }
});

module.exports = router;
