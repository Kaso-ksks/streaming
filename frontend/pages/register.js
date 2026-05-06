import { useState } from "react";
import API from "../services/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await API.post("/auth/register", { email, password });
      alert("Usuário criado!");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Registro</h1>

      <input
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Senha"
        onChange={e => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleRegister}>
        Criar conta
      </button>
    </div>
  );
}