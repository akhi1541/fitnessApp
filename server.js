const mongoose = require("mongoose");
const url = 'mongodb+srv://Akhi1541-:auqhbYahkEjhkKra@cluster0.maejkv5.mongodb.net/appName=Cluster0'
mongoose
  .connect(url)
  .then(() => {
    console.log(`DB connected `);
  });

const app = require("./app");
const port = 3000;

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
