const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

function safeUser(user) {
  return {
    id: user._id,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    isAdmin: user.isAdmin,
    isPremium: user.isPremium
  };
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

    await User.create({
      email: email.toLowerCase(),
      password: hash
    });

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
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado"
      });
    }

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
      user.avatarUrl = avatarUrl.trim();
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