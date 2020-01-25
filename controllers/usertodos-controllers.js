const uuid = require("uuid/v4");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/HttpError");
const mongoose = require("mongoose");
const Todo = require("../models/todo");
const User = require("../models/user");
const Action = require("../models/action");

// @DESC    Get all users
// @TYPE    GET
// @ROUTES  /api/v1/users/
// PRIVATE
const getUsers = async (req, res, next) => {
  const users = await User.find({}, "-password");

  res.json({ users: users });
};

// @DESC    Get single user by ID
// @TYPE    GET
// @ROUTES  /api/v1/users/:uid
// PUBLIC
const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Could not find a user with that ID",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("No user with that ID exists", 500);
    return next(error);
  }

  res.status(200).json({ success: true, data: user });
};

// @DESC    Create a user (SIGNUP)
// @TYPE    POST
// @ROUTES  /api/v1/users/signup
// PRIVATE
const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user email exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user. Please try again", 500);
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    todos: [],
    partner: ""
  });

  try {
    await newUser.save();
  } catch (error) {
    console.log(error);
    const err = new HttpError("Signing up failed, please try again", 500);
    return next(err);
  }

  // jwt
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "secret_token",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({
    success: true,
    userId: createdUser.id,
    email: createdUser.email,
    token: token
  });
};

// @DESC    LOGIN
// @TYPE    POST
// @ROUTES  /api/v1/users/login
// PRIVATE
const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials. Could not log in", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Invalid credentials. Could not log in", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials. Could not log in", 500);
    return next(error);
  }

  // Find the partner ID
  let partner;
  try {
    partner = await User.findOne({ email: existingUser.partner }).populate(
      "todos"
    );
  } catch (err) {
    const error = new HttpError(
      "Issues with logging in. Please try again.",
      401
    );
    return next(error);
  }

  // jwt
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "secret_token",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Issues with logging in. Please try again.",
      401
    );
    return next(error);
  }

  res.json({
    partner: partner || "None",
    userId: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    token: token
  });
};

// @DESC    Register partner to current user
// @TYPE    PATCH
// @ROUTES  /api/v1/users/:uid
// PRIVATE
const registerPartner = async (req, res, next) => {
  const userId = req.params.uid;

  const { partnerEmail } = req.body;
  console.log(partnerEmail);

  // Check the partner exists in the DB
  let partner;
  try {
    partner = await User.findOne({ email: partnerEmail });
  } catch (err) {
    const error = new HttpError("Could not find the partner.", 402);
    return next(error);
  }

  if (!partner) {
    const error = new HttpError("Could not find the partner.", 402);
    return next(error);
  }

  // Find the user
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Could not find the User.", 402);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find the User.", 402);
    return next(error);
  }

  // If partner field already exists - cancel

  if (user.partner !== "") {
    const error = new HttpError("A partner already exists for this user.", 402);
    return next(error);
  }

  partner.partner = user.email;
  partner.save();
  user.partner = partnerEmail;
  user.save();

  // Add a partner to the USER

  res.status(200).json({ success: true, data: user });
};

// @DESC    Create a goal for a user
// @TYPE    PUT
// @ROUTES  /api/v1/users/newgoal
// PRIVATE
const newGoal = async (req, res, next) => {
  console.log("New goal route");
  // const userId = req.params.uid;
  const { title, description, deadline, status, creator } = req.body;

  console.log(creator);
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Could not find a user, please try again", 500);
    return next(error);
  }

  if (!user) {
    console.log("No user found");
    const error = new HttpError("Could not find user from provided ID", 404);
    return next(error);
  }

  const createdGoal = new Todo({
    title,
    description,
    deadline,
    status,
    creator: mongoose.Types.ObjectId(creator),
    actions: [],
    history: []
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdGoal.save({ session: sess });
    user.todos.push(createdGoal);
    console.log("pushing the goal to the user");
    await user.save({ session: sess });
    console.log("Saving to the DB");
    await sess.commitTransaction();
  } catch (error) {
    console.log(error);
    const err = new HttpError("Creating goal failed, please try again", 500);
    return next(err);
  }

  res.status(200).json({ success: true, data: createdGoal });
};

// @DESC    Get goals by User ID
// @TYPE    GET
// @ROUTES  /api/v1/users/:uid/goals
// PRIVATE
const getGoalsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  console.log(userId);
  // Find the user in the db
  let actions;
  try {
    actions = await Todo.find({ creator: userId });
    console.log(actions);
  } catch (err) {
    const error = new HttpError("Could not find a user. Try again", 500);
    return next(error);
  }

  if (!actions) {
    const error = new HttpError("Could not find a user. Try again", 500);
    return next(error);
  }

  res.status(200).json({
    success: true,
    data: actions.map(action => action.toObject({ getters: true }))
  });
};

// BELOW NOT WORKING ROUTES

// @DESC    Delete user completely
// @TYPE    DELETE
// @ROUTES  /api/v1/users/:uid
// PRIVATE
const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Something went wrong. Deleting failed", 500);
    return next(error);
  }

  console.log(user);

  if (!user) {
    const error = new HttpError("Could not find a user for this ID", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Something went wrong. Deleting failed", 500);
    return next(error);
  }

  res.status(200).json({ success: true, data: user });
};

// @DESC    Delete single goal
// @TYPE    DELETE
// @ROUTES  /api/v1/users/:uid/goal/
// PRIVATE
const deleteSingleGoal = async (req, res, next) => {
  const { goalId, userId } = req.body;

  // Get the user
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("Cannot find user. Please try again", 404);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Cannot find user. Please try again", 404);
    return next(error);
  }

  // Find the goal
  let goal;
  try {
    goal = await Todo.findById(goalId);
  } catch (err) {
    const error = new HttpError("Cannot delete goal. Please try again", 404);
    return next(error);
  }

  if (!goal) {
    const error = new HttpError("Cannot delete goal. Please try again", 404);
    return next(error);
  }

  // Find partner
  let partner;
  try {
    partner = await User.findOne({ email: user.partner });
  } catch (err) {
    const error = new HttpError("Cannot find a user with this goal", 404);
    return next(error);
  }

  if (!partner) {
    const error = new HttpError("Cannot find a user with this goal", 404);
    return next(error);
  }

  // Any actions that are part of the goal
  let action;
  try {
    action = await Action.findOne({ todoId: goalId });
  } catch (err) {
    const error = new HttpError(
      "Failed to find any actions attributed to this goal",
      404
    );
    return next(error);
  }

  if (!action) {
    const error = new HttpError(
      "Failed to find any actions attributed to this goal",
      404
    );
    return next(error);
  }

  try {
  } catch (err) {
    console.log(err);
    const error = new HttpError("Cannot delete goal. Please try again", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // await user.remove({ session: sess });
    await action.remove({ session: sess });
    // await partner.remove({ session: sess });
    user.todos.pull(goal);
    partner.actions.pull(action);
    await user.save({ session: sess });
    await partner.save({ session: sess });
    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Cannot delete goal. Please try again", 404);
    return next(error);
  }

  res.status(200).json({ user: user, partner: partner });
};

// @DESC    Delete all goals
// @TYPE    DELETE
// @ROUTES  /api/v1/users/:uid/goals
// PRIVATE
const deleteAllGoals = async (req, res, next) => {
  const userId = req.params.uid;

  // Test if user exists
  let user;
  try {
    user = await User.findById(userId).populate("todos");
  } catch (err) {
    const error = new HttpError("Something went wrong. Deleting failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user", 402);
    return next(error);
  }

  let goals;
  try {
    goals = await Todo.find({ creator: userId }).populate("creator");
  } catch (err) {
    const error = new HttpError("Could not find any goals", 402);
    return next(error);
  }

  if (!goals) {
    return next(new HttpError("Could not find any goals", 402));
  }

  console.log(goals);

  res.status(200).json({ success: true, message: "All Goals deleted" });
};

// @DESC    Delete partner connection
// @TYPE    DELETE
// @ROUTES  /api/v1/users/:uid/partner
// PRIVATE
const deleteConnection = (req, res, next) => {
  const userId = req.params.uid;

  const userIndex = DUMMY_USERS.findIndex(u => u.id === userId);

  DUMMY_USERS[userIndex].partner = false;

  res
    .status(200)
    .json({ success: true, message: "Partner connection has been deleted." });
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.signup = signup;
exports.newGoal = newGoal;
exports.login = login;
exports.registerPartner = registerPartner;
exports.getGoalsByUserId = getGoalsByUserId;
exports.deleteUser = deleteUser;
exports.deleteSingleGoal = deleteSingleGoal;
exports.deleteAllGoals = deleteAllGoals;
exports.deleteConnection = deleteConnection;
