const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

function ensureProfiles(user) {
  if (!user.profiles || user.profiles.length === 0) {
    user.profiles = [
      {
        name: "Principal",
        avatarUrl: user.avatarUrl || ""
      }
    ];
  }

  if (!user.activeProfileId) {
    user.activeProfileId = user.profiles[0]._id;
  }

  return user;
}

function safeUser(user) {
  ensureProfiles(user);

  const activeProfile =
    user.profiles.find(
      (profile) =>
        String(profile._id) === String(user.activeProfileId)
    ) || user.profiles[0];

  return {
    id: user._id,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    premiumBannerUrl: user.isPremium ? user.premiumBannerUrl || "" : "",
    isAdmin: user.isAdmin,
    isPremium: user.isPremium,
    favoriteLimit: user.isPremium ? null : 50,
    profiles: user.profiles.map((profile) => ({
      id: profile._id,
      name: profile.name,
      avatarUrl: profile.avatarUrl || ""
    })),
    activeProfileId: user.activeProfileId,
    activeProfile: activeProfile
      ? {
          id: activeProfile._id,
          name: activeProfile.name,
          avatarUrl: activeProfile.avatarUrl || ""
        }
      : null
  };
}

function isValidUrlOrEmpty(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Preencha todos os campos"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email já cadastrado"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      profiles: [
        {
          name: "Principal",
          avatarUrl: ""
        }
      ]
    });

    user.activeProfileId = user.profiles[0]._id;
    await user.save();

    res.status(201).json({
      message: "Usuário criado com sucesso"
    });
  } catch (err) {
    console.log("Erro no register:", err);

    res.status(500).json({
      message: "Erro interno no servidor"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Preencha todos os campos"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(400).json({
        message: "Usuário não encontrado"
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({
        message: "Senha inválida"
      });
    }

    ensureProfiles(user);
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro no login:", err);

    res.status(500).json({
      message: "Erro interno no servidor"
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);
    await user.save();

    res.json(safeUser(user));
  } catch (err) {
    console.log("Erro ao buscar perfil:", err);

    res.status(500).json({
      message: "Erro ao buscar perfil"
    });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const {
      email,
      avatarUrl,
      premiumBannerUrl,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);

    if (email && email.toLowerCase() !== user.email) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Digite sua senha atual para alterar o email"
        });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return res.status(400).json({
          message: "Senha atual incorreta"
        });
      }

      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: {
          $ne: user._id
        }
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Esse email já está em uso"
        });
      }

      user.email = email.toLowerCase();
    }

    if (typeof avatarUrl === "string") {
      if (!isValidUrlOrEmpty(avatarUrl.trim())) {
        return res.status(400).json({
          message: "URL da foto inválida"
        });
      }

      user.avatarUrl = avatarUrl.trim();
    }

    if (typeof premiumBannerUrl === "string") {
      if (!user.isPremium && premiumBannerUrl.trim()) {
        return res.status(403).json({
          message: "Banner exclusivo é apenas para premium"
        });
      }

      if (!isValidUrlOrEmpty(premiumBannerUrl.trim())) {
        return res.status(400).json({
          message: "URL do banner inválida"
        });
      }

      user.premiumBannerUrl = user.isPremium
        ? premiumBannerUrl.trim()
        : "";
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Digite sua senha atual para alterar a senha"
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "A nova senha precisa ter pelo menos 6 caracteres"
        });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return res.status(400).json({
          message: "Senha atual incorreta"
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      message: "Perfil atualizado com sucesso",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao atualizar perfil:", err);

    res.status(500).json({
      message: "Erro ao atualizar perfil"
    });
  }
});

router.post("/profiles", auth, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);

    const limit = user.isPremium ? 5 : 1;

    if (user.profiles.length >= limit) {
      return res.status(403).json({
        message: user.isPremium
          ? "Limite de 5 perfis atingido"
          : "Múltiplos perfis são exclusivos premium"
      });
    }

    if (avatarUrl && !isValidUrlOrEmpty(avatarUrl.trim())) {
      return res.status(400).json({
        message: "URL do avatar inválida"
      });
    }

    user.profiles.push({
      name: name || `Perfil ${user.profiles.length + 1}`,
      avatarUrl: avatarUrl || ""
    });

    await user.save();

    res.status(201).json({
      message: "Perfil criado",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao criar perfil:", err);

    res.status(500).json({
      message: "Erro ao criar perfil"
    });
  }
});

router.put("/profiles/:profileId", auth, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);

    const profile = user.profiles.id(req.params.profileId);

    if (!profile) {
      return res.status(404).json({
        message: "Perfil não encontrado"
      });
    }

    if (name) profile.name = name;

    if (typeof avatarUrl === "string") {
      if (!isValidUrlOrEmpty(avatarUrl.trim())) {
        return res.status(400).json({
          message: "URL do avatar inválida"
        });
      }

      profile.avatarUrl = avatarUrl.trim();
    }

    await user.save();

    res.json({
      message: "Perfil atualizado",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao atualizar perfil:", err);

    res.status(500).json({
      message: "Erro ao atualizar perfil"
    });
  }
});

router.put("/profiles/:profileId/active", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);

    const profile = user.profiles.id(req.params.profileId);

    if (!profile) {
      return res.status(404).json({
        message: "Perfil não encontrado"
      });
    }

    user.activeProfileId = profile._id;

    await user.save();

    res.json({
      message: "Perfil ativo alterado",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao alterar perfil ativo:", err);

    res.status(500).json({
      message: "Erro ao alterar perfil ativo"
    });
  }
});

router.delete("/profiles/:profileId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    ensureProfiles(user);

    if (user.profiles.length <= 1) {
      return res.status(400).json({
        message: "Você precisa manter pelo menos um perfil"
      });
    }

    const profile = user.profiles.id(req.params.profileId);

    if (!profile) {
      return res.status(404).json({
        message: "Perfil não encontrado"
      });
    }

    const wasActive =
      String(user.activeProfileId) === String(profile._id);

    user.profiles.pull(profile._id);

    if (wasActive) {
      user.activeProfileId = user.profiles[0]._id;
    }

    await user.save();

    res.json({
      message: "Perfil removido",
      user: safeUser(user)
    });
  } catch (err) {
    console.log("Erro ao remover perfil:", err);

    res.status(500).json({
      message: "Erro ao remover perfil"
    });
  }
});

router.delete("/profile", auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Senha obrigatória"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Senha incorreta"
      });
    }

    await User.findByIdAndDelete(user._id);

    res.json({
      message: "Conta deletada com sucesso"
    });
  } catch (err) {
    console.log("Erro ao deletar conta:", err);

    res.status(500).json({
      message: "Erro ao deletar conta"
    });
  }
});

module.exports = router;