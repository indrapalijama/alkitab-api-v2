const express = require("express");
const router = express.Router();
const bible_controller = require("../controller/bible.controller");

router.get("/versions", bible_controller.getVersions);
router.get("/version/list", bible_controller.getVersions);
router.get("/version/:version", bible_controller.getVersionDetail);
router.get("/read/:book/:chapter/:version?", bible_controller.read);
router.get("/find/:book", bible_controller.find);

module.exports = router;
