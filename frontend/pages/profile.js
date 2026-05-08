import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../services/api";
import BackButton from "../components/BackButton";
import Toast from "../components/Toast";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    password: "",
    confirm: false,
    deleting: false
  });

  const [form, setForm] = useState({
    email: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [toast, setToast] = useState({
    message: "",
    type: "info"
  });

  const showToast = (message, type = "info") => {
    setToast({
      message,
      type
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoaded(true);
      return;
    }

    loadProfile();
    loadFavorites();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get("/auth/me");

      setUser(res.data);

      setForm((prev) => ({
        ...prev,
        email: res.data.email || "",
        avatarUrl: res.data.avatarUrl || ""
      }));

      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error(err);

      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);

        setForm((prev) => ({
          ...prev,
          email: parsedUser.email || "",
          avatarUrl: parsedUser.avatarUrl || ""
        }));
      }
    } finally {
      setLoaded(true);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await API.get("/favorites");

      setFavorites(res.data);
    } catch (err) {
      console.error(err);
      setFavorites([]);
    }
  };

  const getInitial = () => {
    if (!user?.email) return "?";

    return user.email.charAt(0).toUpperCase();
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      if (form.newPassword && form.newPassword !== form.confirmPassword) {
        showToast("As senhas novas não conferem", "warning");
        return;
      }

      setSaving(true);

      const payload = {
        email: form.email,
        avatarUrl: form.avatarUrl,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      };

      const res = await API.put("/auth/profile", payload);

      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      showToast("Perfil atualizado com sucesso", "success");
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao atualizar perfil",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  const openDeleteModal = () => {
    setDeleteModal({
      open: true,
      password: "",
      confirm: false,
      deleting: false
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.deleting) return;

    setDeleteModal({
      open: false,
      password: "",
      confirm: false,
      deleting: false
    });
  };

  const handleDeleteAccount = async () => {
    try {
      if (!deleteModal.password) {
        showToast("Digite sua senha", "warning");
        return;
      }

      setDeleteModal((prev) => ({
        ...prev,
        deleting: true
      }));

      await API.delete("/auth/profile", {
        data: {
          password: deleteModal.password
        }
      });

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/register";
    } catch (err) {
      console.error(err);

      setDeleteModal((prev) => ({
        ...prev,
        deleting: false
      }));

      showToast(
        err.response?.data?.message ||
          "Erro ao deletar conta",
        "error"
      );
    }
  };

  if (!loaded) {
    return <div className="loading">Carregando...</div>;
  }

  if (!user) {
    return (
      <>
        <BackButton />

        <div className="profile-page-custom">
          <div className="profile-card-custom small-card">
            <h1>Você não está logado</h1>

            <button
              className="primary-btn-custom"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Fazer login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "info"
          })
        }
      />

      {deleteModal.open && (
        <div
          className="streaming-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="streaming-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-danger-side">
              <span>⚠</span>
            </div>

            <div className="modal-content">
              {!deleteModal.confirm ? (
                <>
                  <span className="modal-tag danger">
                    Zona perigosa
                  </span>

                  <h2>Deletar conta</h2>

                  <p>
                    Digite sua senha para continuar.
                  </p>

                  <input
                    type="password"
                    placeholder="Sua senha"
                    value={deleteModal.password}
                    onChange={(e) =>
                      setDeleteModal((prev) => ({
                        ...prev,
                        password: e.target.value
                      }))
                    }
                  />

                  <div className="modal-actions">
                    <button
                      className="modal-cancel"
                      onClick={closeDeleteModal}
                    >
                      Cancelar
                    </button>

                    <button
                      className="modal-delete"
                      onClick={() =>
                        setDeleteModal((prev) => ({
                          ...prev,
                          confirm: true
                        }))
                      }
                    >
                      Continuar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="modal-tag danger">
                    Confirmação final
                  </span>

                  <h2>Tem certeza?</h2>

                  <p>
                    Sua conta será removida permanentemente.
                    Essa ação não pode ser desfeita.
                  </p>

                  <div className="modal-actions">
                    <button
                      className="modal-cancel"
                      onClick={closeDeleteModal}
                      disabled={deleteModal.deleting}
                    >
                      Voltar
                    </button>

                    <button
                      className="modal-delete"
                      onClick={handleDeleteAccount}
                      disabled={deleteModal.deleting}
                    >
                      {deleteModal.deleting
                        ? "Deletando..."
                        : "Deletar permanentemente"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <BackButton />

      <div className="profile-page-custom">
        <div className="profile-card-custom">
          <div className="profile-header-custom">
            <div className="profile-avatar-custom">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Foto de perfil" />
              ) : (
                <span>{getInitial()}</span>
              )}
            </div>

            <div>
              <span className="profile-tag-custom">
                {user.isPremium ? "Premium" : "Gratuito"}
              </span>

              <h1>Meu Perfil</h1>

              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-grid-custom">
            <section className="profile-section-custom">
              <h2>Dados da conta</h2>

              <label>Email</label>

              <input
                value={form.email}
                onChange={(e) =>
                  handleChange("email", e.target.value)
                }
                placeholder="Seu email"
              />

              <label>URL da foto</label>

              <input
                value={form.avatarUrl}
                onChange={(e) =>
                  handleChange("avatarUrl", e.target.value)
                }
                placeholder="https://exemplo.com/foto.png"
              />

              <div className="account-info-custom">
                <div>
                  <span>Plano</span>

                  <strong>
                    {user.isPremium ? "Premium" : "Gratuito"}
                  </strong>
                </div>

                <div>
                  <span>Conta</span>

                  <strong>
                    {user.isAdmin ? "Administrador" : "Usuário"}
                  </strong>
                </div>
              </div>
            </section>

            <section className="profile-section-custom">
              <h2>Segurança</h2>

              <label>Senha atual</label>

              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  handleChange("currentPassword", e.target.value)
                }
                placeholder="Digite sua senha atual"
              />

              <label>Nova senha</label>

              <input
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  handleChange("newPassword", e.target.value)
                }
                placeholder="Nova senha"
              />

              <label>Confirmar nova senha</label>

              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                placeholder="Repita a nova senha"
              />
            </section>
          </div>

          <div className="profile-actions-custom">
            <button
              className="primary-btn-custom"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>

            <button
              className="logout-btn-custom"
              onClick={handleLogout}
            >
              Sair da conta
            </button>

            <button
              className="delete-account-btn-custom"
              onClick={openDeleteModal}
            >
              Deletar conta
            </button>
          </div>

          <section className="favorites-section-custom">
            <h2>❤️ Favoritos</h2>

            {favorites.length === 0 && (
              <p className="empty-favorites-custom">
                Nenhum favorito ainda
              </p>
            )}

            <div className="favorites-grid-custom">
              {favorites.map((movie) => (
                <Link
                  key={movie._id}
                  href={`/movie/${movie._id}`}
                  className="favorite-card-custom"
                >
                  {movie.image ? (
                    <img src={movie.image} alt={movie.title} />
                  ) : (
                    <div className="favorite-placeholder-custom">
                      Sem imagem
                    </div>
                  )}

                  <span>{movie.title}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .profile-page-custom {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 35px;
          background:
            linear-gradient(
              rgba(0, 0, 0, 0.6),
              rgba(20, 20, 20, 1)
            ),
            #141414;
        }

        .profile-card-custom {
          width: 100%;
          max-width: 1100px;
          background: #1b1b1b;
          border-radius: 18px;
          padding: 35px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
        }

        .small-card {
          max-width: 450px;
          text-align: center;
        }

        .profile-header-custom {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 1px solid #333;
        }

        .profile-avatar-custom {
          width: 120px;
          height: 120px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, #e50914, #7a0006);
          flex-shrink: 0;
        }

        .profile-avatar-custom img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-custom span {
          color: white;
          font-size: 46px;
          font-weight: bold;
        }

        .profile-tag-custom {
          display: inline-block;
          background: #e50914;
          color: white;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .profile-header-custom h1 {
          font-size: 2.4rem;
          margin-bottom: 8px;
        }

        .profile-header-custom p {
          color: #ccc;
        }

        .profile-grid-custom {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .profile-section-custom {
          background: #242424;
          padding: 22px;
          border-radius: 15px;
        }

        .profile-section-custom h2 {
          margin-bottom: 18px;
        }

        label {
          display: block;
          color: #bbb;
          font-size: 14px;
          margin-bottom: 8px;
        }

        input {
          width: 100%;
          background: #151515;
          color: white;
          border: 1px solid #333;
          padding: 14px;
          border-radius: 10px;
          outline: none;
          margin-bottom: 16px;
        }

        input:focus {
          border-color: #e50914;
          box-shadow: 0 0 0 2px rgba(229, 9, 20, 0.25);
        }

        .account-info-custom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 5px;
        }

        .account-info-custom div {
          background: #151515;
          padding: 15px;
          border-radius: 12px;
        }

        .account-info-custom span {
          display: block;
          color: #999;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .account-info-custom strong {
          color: white;
        }

        .profile-actions-custom {
          display: flex;
          gap: 12px;
          margin-bottom: 35px;
          flex-wrap: wrap;
        }

        button {
          border: none;
          padding: 14px 18px;
          border-radius: 10px;
          cursor: pointer;
          color: white;
          font-weight: bold;
          transition: 0.2s;
        }

        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .primary-btn-custom {
          background: #e50914;
          flex: 1;
        }

        .logout-btn-custom {
          background: #333;
        }

        .delete-account-btn-custom {
          background: #7a0006;
        }

        .delete-account-btn-custom:hover {
          background: #a5000c;
        }

        .favorites-section-custom {
          border-top: 1px solid #333;
          padding-top: 25px;
        }

        .favorites-section-custom h2 {
          margin-bottom: 20px;
        }

        .empty-favorites-custom {
          color: #aaa;
          background: #242424;
          padding: 18px;
          border-radius: 12px;
        }

        .favorites-grid-custom {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 18px;
        }

        .favorite-card-custom {
          background: #242424;
          border-radius: 13px;
          overflow: hidden;
          text-decoration: none;
          color: white;
          transition: 0.2s;
        }

        .favorite-card-custom:hover {
          transform: scale(1.03);
        }

        .favorite-card-custom img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
        }

        .favorite-placeholder-custom {
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #777;
          background: #111;
        }

        .favorite-card-custom span {
          display: block;
          padding: 12px;
          font-weight: bold;
          font-size: 14px;
        }

        .loading {
          width: 100%;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #141414;
          color: white;
          font-size: 24px;
        }

        .streaming-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .streaming-modal {
          width: 100%;
          max-width: 680px;
          background: linear-gradient(135deg, #242424, #111);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 180px 1fr;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.75);
        }

        .modal-danger-side {
          background: linear-gradient(180deg, #7a0006, #2a0002);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-danger-side span {
          font-size: 5rem;
          color: white;
          font-weight: bold;
        }

        .modal-content {
          padding: 32px;
        }

        .modal-content h2 {
          margin-bottom: 12px;
          font-size: 2rem;
        }

        .modal-content p {
          color: #ccc;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .modal-tag {
          display: inline-block;
          padding: 7px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: bold;
          color: white;
        }

        .modal-tag.danger {
          background: #e50914;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 15px;
        }

        .modal-cancel,
        .modal-delete {
          flex: 1;
        }

        .modal-cancel {
          background: #444;
        }

        .modal-delete {
          background: #e50914;
        }

        .modal-delete:hover {
          background: #ff1f1f;
        }

        @media (max-width: 768px) {
          .profile-page-custom {
            padding: 18px;
          }

          .profile-card-custom {
            padding: 22px;
          }

          .profile-header-custom {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-grid-custom {
            grid-template-columns: 1fr;
          }

          .profile-actions-custom {
            flex-direction: column;
          }

          .account-info-custom {
            grid-template-columns: 1fr;
          }

          .favorites-grid-custom {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          }

          .favorite-card-custom img,
          .favorite-placeholder-custom {
            height: 200px;
          }

          .streaming-modal {
            grid-template-columns: 1fr;
            max-width: 430px;
          }

          .modal-danger-side {
            height: 140px;
          }

          .modal-content {
            padding: 24px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-content h2 {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </>
  );
}