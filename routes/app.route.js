const express = require('express');
const router = express.Router();
const gplay = require('google-play-scraper');

router.get('/version', async (req, res) => {
  try {
    const appId = req.query.appId || 'fulk.evilcorp.dailyreflection';
    const app = await gplay.default.app({ appId });
    
    // google-play-scraper returns version as string, e.g., "1.2.0"
    res.json({
      latestVersionName: app.version,
      // It's hard to get versionCode from the public store, so we provide versionName
      url: app.url,
      forceUpdate: false // Can be configured later
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
