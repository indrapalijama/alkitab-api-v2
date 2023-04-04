const express = require("express");
const router = express.Router();
const bible_controller = require("../controller/bible.controller");

router.get("/read/:book/:chapter/:version?", bible_controller.read);
router.get("/find/:book", bible_controller.find);

module.exports = router;
