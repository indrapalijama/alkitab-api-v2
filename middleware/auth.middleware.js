const dotenv = require("dotenv").config();

module.exports = function (req, res, next) {
  console.log('hit', req.headers.accesskey)
  const token = req.headers.accesskey;
  if (token === process.env.SECRET) {
    next();
  } else {
    res.status(401);
    res.send("Access forbidden");
  }
};
