require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(console.log);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/admin", require("./routes/admin"));

app.listen(5000, () => console.log("Rodando na porta 5000"));