const auth = require("./auth");

module.exports = (req, res, next) => {
  auth(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        message: "Acesso apenas para admin"
      });
    }

    next();
  });
};