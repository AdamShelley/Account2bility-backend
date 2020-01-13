const express = require("express");

const router = express.Router();

const partnertodos = require("../controllers/partnertodos-controllers");

router.get("/:pid", partnertodos.getPartnerById);
router.put("/:pid/suggest", partnertodos.suggestGoal);

module.exports = router;
