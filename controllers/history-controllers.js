const uuid = require("uuid/v4");
const HttpError = require("../models/HttpError");

// @DESC    Get all historical goals by user id
// @TYPE    GET
// @ROUTES  /api/v1/history/:uid
// PRIVATE
const getAllHistoricalItems = (req, res, next) => {
  res.status(200).json({ success: true });
};

exports.getAllHistoricalItems = getAllHistoricalItems;
