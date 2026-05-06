const auth = require("./auth");

module.exports = (req, res, next) => {
  auth(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).send("Admin only");
    next();
  });
};