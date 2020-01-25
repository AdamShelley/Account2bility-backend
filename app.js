const express = require("express");
const bodyParser = require("body-parser");
const userTodos = require("./routes/usertodos-route");
const actionList = require("./routes/actionlist-route");
const partnerTodos = require("./routes/partnertodos-route");
const history = require("./routes/history-route");
const mongoose = require("mongoose");
const HttpError = require("./models/HttpError");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/v1/users", userTodos);
app.use("/api/v1/partner", partnerTodos);
app.use("/api/v1/actions", actionList);
app.use("/api/v1/history", history);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500).json({
    message: error.message || "An unknown error occurred!"
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@account2bility-xiurg.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    }
  )
  .then(() => {
    app.listen(3000);
  })
  .catch(err => console.log(err));
