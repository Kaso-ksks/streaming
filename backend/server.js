require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* MIDDLEWARES */

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

/* DATABASE */

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado");
  })
  .catch((err) => {
    console.log("Erro MongoDB:", err);
  });

/* ROUTES */

app.get("/", (req, res) => {
  res.json({
    message: "API do streaming rodando"
  });
});

app.use(
  "/api/movies",
  require("./routes/movies")
);

app.use(
  "/api/auth",
  require("./routes/auth")
);

app.use(
  "/api/admin",
  require("./routes/admin")
);

app.use(
  "/api/favorites",
  require("./routes/favorites")
);

/* SERVER */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});