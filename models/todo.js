const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const todoSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  deadline: {
    type: String,
    required: false
  },
  status: {
    type: Boolean,
    required: true
  },
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  actions: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Action"
    }
  ]
});

module.exports = mongoose.model("Todo", todoSchema);
