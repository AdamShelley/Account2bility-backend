const uuid = require("uuid/v4");
const HttpError = require("../models/HttpError");
const mongoose = require("mongoose");
const Todo = require("../models/todo");
const User = require("../models/user");
const Action = require("../models/action");

// @DESC    Get all actions for a specific user
// @TYPE    GET
// @ROUTES  /api/v1/actions/:uid
// PRIVATE
const getActionsByUserId = async (req, res, next) => {
  // Eventually this will just pass the logged in user
  const userId = req.params.uid;
  let user;
  try {
    user = await User.findById(userId).populate({
      path: "actions",
      populate: { path: "todoId" }
    });
  } catch (err) {
    const error = new HttpError("Could not find the user.", 402);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find the user.", 402);
    return next(error);
  }

  res.json({
    success: true,
    actions: user
  });
};

// @DESC    Get goal for action by ID
// @TYPE    GET
// @ROUTES  /api/v1/actions/goal
// PRIVATE
const getGoalByActionId = async (req, res, next) => {
  const actionId = req.params.aid;
  //im working on this.
  let action;
  try {
    action = await Action.findById(actionId).populate("todoId");
  } catch (err) {
    const error = new HttpError("Could not find the action.", 401);
    return next(error);
  }

  if (!action) {
    const error = new HttpError("Could not find the action.", 401);
    return next(error);
  }

  const todoId = action.todoId;

  let goal;
  try {
    goal = await Todo.findById(todoId);
  } catch (err) {
    const error = new HttpError("Could not find the goal.", 401);
    return next(error);
  }

  if (!goal) {
    const error = new HttpError("Could not find the goal.", 401);
    return next(error);
  }

  res.status(200).json({
    success: true,
    goal: goal
  });
};

// @DESC    Create new action for a specific partner. The Partner ID is in the body
// @TYPE    POST
// @ROUTES  /api/v1/actions/:uid
// PRIVATE
const createAction = async (req, res, next) => {
  // Find user
  const userId = req.params.uid;

  const { todoId, action } = req.body;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("The user could not be found.", 402);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("The user could not be found.", 402);
    return next(error);
  }

  let partner;
  try {
    partner = await User.findOne({ email: user.partner });
  } catch (err) {
    const error = new HttpError("The user does not have a partner.", 402);
    return next(error);
  }

  if (!partner) {
    const error = new HttpError("The user does not have a partner.", 402);
    return next(error);
  }

  const createdAction = new Action({
    todoId,
    action,
    creator: userId,
    partner: partner._id
  });

  // Find todo by ID
  let todo;
  try {
    todo = await Todo.findById(todoId);
  } catch (err) {
    const error = new HttpError(
      "The user does not have a goal with this ID.",
      500
    );
    return next(error);
  }

  if (!todo) {
    const error = new HttpError(
      "The user does not have a goal with this ID.",
      500
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdAction.save({ session: sess });
    partner.actions.push(createdAction);
    todo.actions.push(createdAction);
    await partner.save({ session: sess });
    await todo.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating action failed, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({ success: true, data: user });
};

exports.getActionsByUserId = getActionsByUserId;
exports.getGoalByActionId = getGoalByActionId;
exports.createAction = createAction;
