const dotenv = require("dotenv").config();

module.exports = function (req, res, next) {
  const token = req.headers.accesskey;
  if (token === process.env.SECRET) {
    next();
  } else {
    res.status(401);
    res.send("Access forbidden");
  }
};
