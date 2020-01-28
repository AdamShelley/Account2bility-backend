const express = require("express");

const router = express.Router();

const actionList = require("../controllers/actionlist-controller");

router.get("/goal/:aid", actionList.getGoalByActionId);
router.get("/:uid", actionList.getActionsByUserId);
router.patch("/:aid", actionList.actionResponseHandler);
router.post("/", actionList.createAction);
router.post("/suggest", actionList.suggestGoal);
router.delete("/null", actionList.deleteNullActions);

module.exports = router;
