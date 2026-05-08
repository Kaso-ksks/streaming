const auth = require("./auth");
const User = require("../models/User");

module.exports = (req, res, next) => {
  auth(req, res, async () => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          message: "Token inválido"
        });
      }

      const user = await User.findById(req.user.id).select("isAdmin");

      if (!user || !user.isAdmin) {
        return res.status(403).json({
          message: "Acesso apenas para admin"
        });
      }

      next();
    } catch (err) {
      console.log("Erro no middleware admin:", err);

      res.status(500).json({
        message: "Erro ao validar admin"
      });
    }
  });
};