const express = require("express");
const router = express.Router();
const song_controller = require("../controller/song.controller");

router.get("/list", song_controller.getList);
router.get("/detail/:id", song_controller.getSongData);

module.exports = router;
