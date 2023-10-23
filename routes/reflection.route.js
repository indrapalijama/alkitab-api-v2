const express = require("express");
const router = express.Router();
const reflection_controller = require("../controller/reflection.controller");

router.get("/", reflection_controller.get);
router.get("/:version", reflection_controller.getCustom);

module.exports = router;
