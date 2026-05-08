const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Preencha todos os campos"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email já cadastrado"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      email,
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

    const user = await User.findOne({ email });

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
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium
      }
    });

  } catch (err) {
    console.log("Erro no login:", err);

    res.status(500).json({
      message: "Erro interno no servidor"
    });
  }
});

module.exports = router;