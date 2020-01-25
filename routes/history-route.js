const express = require("express");

const router = express.Router();

const history = require("../controllers/history-controllers");

router.get("/:uid", history.getAllHistoricalItems);

module.exports = router;
