import { useState } from "react";
import API from "../services/api";
import Toast from "../components/Toast";
import BackButton from "../components/BackButton";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const handleRegister = async () => {
    try {
      await API.post("/auth/register", {
        email,
        password
      });

      showToast("Conta criada com sucesso", "success");

      setTimeout(() => {
        window.location.href = "/login";
      }, 900);
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message ||
        "Erro ao registrar",
        "error"
      );
    }
  };

  return (
    <div className="auth-container">
      <BackButton />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      <div className="auth-box">
        <h1>Criar Conta</h1>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleRegister}>
          Registrar
        </button>
      </div>
    </div>
  );
}