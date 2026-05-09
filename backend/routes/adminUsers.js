const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const admin = require("../middleware/admin");

router.use(admin);

function safeUser(user) {
  return {
    id: user._id,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    premiumBannerUrl: user.premiumBannerUrl || "",
    isPremium: user.isPremium,
    isAdmin: user.isAdmin,
    profilesCount: user.profiles?.length || 0,
    favoritesCount: user.favorites?.length || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users.map(safeUser));
  } catch (err) {
    console.log("Erro ao listar usuários:", err);

    res.status(500).json({
      message: "Erro ao listar usuários"
    });
  }
});

router.patch("/:id/premium", async (req, res) => {
  try {
    const { isPremium } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    user.isPremium = !!isPremium;

    if (!user.isPremium) {
      user.premiumBannerUrl = "";

      if (user.profiles?.length > 1) {
        user.profiles = [user.profiles[0]];
        user.activeProfileId = user.profiles[0]._id;
      }
    }

    await user.save();

    res.json({
      message: user.isPremium
        ? "Premium ativado"
        : "Premium removido",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao alterar premium:", err);

    res.status(500).json({
      message: "Erro ao alterar premium"
    });
  }
});

router.patch("/:id/admin", async (req, res) => {
  try {
    const { isAdmin } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    if (String(user._id) === String(req.user.id) && !isAdmin) {
      return res.status(400).json({
        message: "Você não pode remover seu próprio admin"
      });
    }

    user.isAdmin = !!isAdmin;

    await user.save();

    res.json({
      message: user.isAdmin
        ? "Admin ativado"
        : "Admin removido",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao alterar admin:", err);

    res.status(500).json({
      message: "Erro ao alterar admin"
    });
  }
});

router.patch("/:id/password", async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "A nova senha precisa ter pelo menos 6 caracteres"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.json({
      message: "Senha alterada com sucesso"
    });
  } catch (err) {
    console.log("Erro ao resetar senha:", err);

    res.status(500).json({
      message: "Erro ao resetar senha"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({
        message: "Você não pode deletar sua própria conta pelo admin"
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    res.json({
      message: "Usuário deletado"
    });
  } catch (err) {
    console.log("Erro ao deletar usuário:", err);

    res.status(500).json({
      message: "Erro ao deletar usuário"
    });
  }
});

module.exports = router;