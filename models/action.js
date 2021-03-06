const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const actionSchema = new Schema({
  todoId: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref: "Todo"
  },
  suggestion: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: false
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
