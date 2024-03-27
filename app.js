const express = require("express");
const app = express();
require("dotenv").config();
const userRouter = require("./routes/userRouter");
app.use(express.json())
app.get("/", (req, res) => {
  res.send("working");
});




app.use("/api/v1/users", userRouter);






module.exports = app;
