const express = require("express");
const router = express.Router();
const song_controller = require("../controller/song.controller");

router.get("/:source/list", song_controller.getList);
router.get("/detail/:source/:id", song_controller.getSongData);

module.exports = router;
