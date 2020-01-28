const uuid = require("uuid/v4");
const HttpError = require("../models/HttpError");
const mongoose = require("mongoose");
const Todo = require("../models/todo");
const User = require("../models/user");
const Action = require("../models/action");
const History = require("../models/history");

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
  // const userId = req.params.uid;

  const { userId, todoId, action } = req.body;

  // Check if action has already been requested

  let actionId;
  try {
    actionId = await Todo.findOne({ todoId: todoId });
  } catch (err) {
    const error = new HttpError("An action already exists for this goal.", 402);
    return next(error);
  }

  // if (actionId) {
  //   const error = new HttpError("The action could not be found.", 402);
  //   return next(error);
  // }

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
    todoId: mongoose.Types.ObjectId(todoId),
    action,
    creator: mongoose.Types.ObjectId(userId),
    partner: mongoose.Types.ObjectId(partner._id),
    response: ""
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

  if (todo.status) {
    const error = new HttpError(
      "The goal already has an action attributed to this.",
      500
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdAction.save({ session: sess });
    partner.actions.push(createdAction);
    todo.status = true;
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

// @DESC    Send accept/reject response to partner
// @TYPE    PUT
// @ROUTES  /api/v1/actions/:aid
// PRIVATE
const actionResponseHandler = async (req, res, next) => {
  const actionId = req.params.aid;

  const { actionResponse, partnerId } = req.body;
  // Check the action response is valid

  if (!actionResponse === "accept" || !actionResponse === "reject") {
    const error = new HttpError(
      "Invalid response. Either accept or reject.",
      404
    );
    return next(error);
  }

  let action;
  try {
    action = await Action.findById(actionId);
  } catch (err) {
    const error = new HttpError(
      "Could not find the action. Please try again",
      404
    );
    return next(error);
  }

  if (!action) {
    const error = new HttpError(
      "Could not find the action. Please try again",
      404
    );
    return next(error);
  }

  if (action.response === "accept" || action.response === "reject") {
    const error = new HttpError(
      "Action already has a response attributed to it.",
      404
    );
    return next(error);
  }

  // Fetch the todo and update the result.

  let todo;
  try {
    todo = await Todo.findById(action.todoId);
  } catch (err) {
    const error = new HttpError(
      "Could not find the todo associated with this action. Please try again",
      404
    );
    return next(error);
  }

  if (!todo) {
    const error = new HttpError(
      "Could not find the todo associated with this action. Please try again",
      404
    );
    return next(error);
  }

  let user;
  try {
    user = await User.findById(partnerId);
  } catch (err) {
    const error = new HttpError(
      "Could not find the todo associated with this user. Please try again",
      404
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the todo associated with this user. Please try again",
      404
    );
    return next(error);
  }

  // Fetch the action and update its response
  // If accept

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await action.save({ session: sess });
    await todo.save({ session: sess });
    await user.save({ session: sess });
    action.response = actionResponse;
    todo.status = true;
    todo.actionReceived = true;
    todo.proceed = actionResponse;
    user.todos.pull(todo);
    user.history.push(todo);
    await action.save({ session: sess });
    await todo.save({ session: sess });
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Could not update the goal. Please try again",
      404
    );
    return next(error);
  }

  res.status(200).json({ success: true, action: action, todo: todo });
};

// @DESC    Send a suggested goal to partner
// @TYPE    PUT
// @ROUTES  /api/v1/actions/suggest
// PRIVATE
const suggestGoal = async (req, res, next) => {
  const { suggestion, userId, partnerId } = req.body;

  let partner;
  try {
    partner = await User.findById(partnerId);
  } catch (err) {
    const error = new HttpError(
      "Could not find the partner. Please try again",
      404
    );
    return next(error);
  }

  if (!partner) {
    const error = new HttpError(
      "Could not find the partner. Please try again",
      404
    );
    return next(error);
  }

  const createSuggestion = new Action({
    suggestion: suggestion,
    creator: mongoose.Types.ObjectId(userId),
    partner: mongoose.Types.ObjectId(partner._id),
    response: "",
    action: "suggestion"
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createSuggestion.save({ session: sess });
    await partner.save({ session: sess });
    partner.actions.push(createSuggestion);
    await partner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating suggestion failed, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({ partner: partner });
};

// @DESC    Cleanup actions
// @TYPE    DELETE
// @ROUTES  /api/v1/actions/null
// PRIVATE

const deleteNullActions = async (req, res, next) => {
  let actions;
  try {
    actions = await Action.find({});
  } catch (err) {
    const error = new HttpError("Could not delete all NULL actions.", 404);
    return next(error);
  }

  if (!actions) {
    const error = new HttpError("Could not delete all NULL actions.", 404);
    return next(error);
  }

  res
    .status(200)
    .json({ success: true, msg: "all null actions deleted", actions: actions });
};

exports.getActionsByUserId = getActionsByUserId;
exports.getGoalByActionId = getGoalByActionId;
exports.createAction = createAction;
exports.actionResponseHandler = actionResponseHandler;
exports.deleteNullActions = deleteNullActions;
exports.suggestGoal = suggestGoal;
