const express = require("express");

const router = express.Router();

const actionList = require("../controllers/actionlist-controller");

router.get("/goal/:aid", actionList.getGoalByActionId);
router.get("/:uid", actionList.getActionsByUserId);
router.put("/:aid", actionList.actionResponseHandler);
router.post("/:uid", actionList.createAction);

module.exports = router;
