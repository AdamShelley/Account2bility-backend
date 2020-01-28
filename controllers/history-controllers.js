const uuid = require("uuid/v4");
const HttpError = require("../models/HttpError");
const User = require("../models/user");
const History = require("../models/history");
const Todo = require("../models/todo");

// @DESC    Get all historical goals by user id
// @TYPE    GET
// @ROUTES  /api/v1/history/:uid
// PRIVATE
const getAllHistoricalItems = async (req, res, next) => {
  const userId = req.params.uid;

  console.log(userId);
  let user;
  try {
    user = await User.findById(userId).populate("history");
  } catch (err) {
    console.log(err);
    const error = new HttpError("Could not find the user", 404);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find the user", 404);
    return next(error);
  }
  console.log(user);

  res.status(200).json({ userHistory: user.history });
};

exports.getAllHistoricalItems = getAllHistoricalItems;
