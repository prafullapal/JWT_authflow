const mongoose = require("mongoose");

const db = {};
db.users = require("./Users");
db.tokens = require("./Tokens");

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
  })
  .then(() => {
    console.log("Connection established to DB.");
  })
  .catch((error) => {
    console.error("Connection Failed: ", error);
  });

module.exports = db;
