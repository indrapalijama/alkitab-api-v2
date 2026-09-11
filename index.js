const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors"); // Add the cors middleware
var app = express();
const isAuth = require("./middleware/auth.middleware");

var bible = require("./routes/bible.route");
var reflection = require("./routes/reflection.route");
var song = require("./routes/song.route");
var appRoute = require("./routes/app.route");
var docsRoute = require("./routes/docs.route");
var legalRoute = require("./routes/legal.route");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    
  })
);

app.get("/", (req, res) => {
  res.send(new String("soli deo gloria - API Documentation available at /docs"));
});
app.use("/", legalRoute); // Privacy Policy & Data Deletion pages
app.use("/docs", docsRoute); // Interactive Swagger UI & OpenAPI JSON
app.use("/api-docs", (req, res) => res.redirect("/docs"));
app.use("/bible", isAuth, bible);
app.use("/reflection", isAuth, reflection);
app.use("/song", isAuth, song);
app.use("/app", appRoute); // Not auth required

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`cooking now @ http://localhost:${process.env.PORT}`);
});
