const dotenv = require("dotenv").config();
const express = require("express");
var app = express();
const isAuth = require("./middleware/auth.middleware");

var bible = require("./routes/bible.route");
var reflection = require("./routes/reflection.route");
var song = require("./routes/song.route");

app.get("/", (req, res) => {
  res.send(new String("soli deo gloria"));
});
app.use("/bible", isAuth, bible);
app.use("/reflection", isAuth, reflection);
app.use("/song", isAuth, song);

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`server started at http://localhost:${process.env.PORT}`);
});
