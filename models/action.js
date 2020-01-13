const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const actionSchema = new Schema({
  todoId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Todo"
  },
  action: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  partner: {
    type: mongoose.Types.ObjectId,
    reqired: true
  }
});

module.exports = mongoose.model("Action", actionSchema);
