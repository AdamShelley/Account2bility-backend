const express = require("express");
const checkAuth = require("../middleware/check-auth");
const router = express.Router();

const userTodos = require("../controllers/usertodos-controllers");

router.get("/", userTodos.getUsers);
router.get("/:uid", userTodos.getUserById);
router.get("/:uid/goals", userTodos.getGoalsByUserId);
router.post("/signup", userTodos.signup);
router.post("/login", userTodos.login);

router.use(checkAuth);

router.post("/newgoal", userTodos.newGoal);
router.patch("/:uid", userTodos.registerPartner);
router.delete("/goals", userTodos.deleteSingleGoal);
router.delete("/:uid", userTodos.deleteUser);
router.delete("/:uid/goals", userTodos.deleteAllGoals);
router.delete("/:uid/partner", userTodos.deleteConnection);

module.exports = router;
