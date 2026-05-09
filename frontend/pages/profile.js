import { useEffect, useState } from "react";
import Link from "next/link";
import API from "../services/api";
import BackButton from "../components/BackButton";
import Toast from "../components/Toast";

const emptyProfileForm = {
  name: "",
  avatarUrl: ""
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState(emptyProfileForm);

  const [editProfileModal, setEditProfileModal] = useState({
    open: false,
    profile: null,
    name: "",
    avatarUrl: "",
    saving: false
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    password: "",
    confirm: false,
    deleting: false
  });

  const [form, setForm] = useState({
    email: "",
    avatarUrl: "",
    premiumBannerUrl: "",
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

  const syncUser = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));

    setForm((prev) => ({
      ...prev,
      email: data.email || "",
      avatarUrl: data.avatarUrl || "",
      premiumBannerUrl: data.premiumBannerUrl || ""
    }));
  };

  const loadProfile = async () => {
    try {
      const res = await API.get("/auth/me");
      syncUser(res.data);
    } catch (err) {
      console.error(err);

      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        syncUser(parsedUser);
      }
    } finally {
      setLoaded(true);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await API.get("/favorites");
      setFavorites(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setFavorites([]);
    }
  };

  const getInitial = () => {
    const name =
      user?.activeProfile?.name ||
      user?.email ||
      "?";

    return name.charAt(0).toUpperCase();
  };

  const getAvatar = () => {
    return (
      user?.activeProfile?.avatarUrl ||
      user?.avatarUrl ||
      ""
    );
  };

  const getDisplayName = () => {
    return user?.activeProfile?.name || "Principal";
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
        premiumBannerUrl: form.premiumBannerUrl,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      };

      const res = await API.put("/auth/profile", payload);

      syncUser(res.data.user);

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

  const handleCreateProfile = async () => {
    try {
      if (!profileForm.name.trim()) {
        showToast("Digite o nome do perfil", "warning");
        return;
      }

      const res = await API.post("/auth/profiles", profileForm);

      syncUser(res.data.user);
      setProfileForm(emptyProfileForm);

      showToast("Perfil criado", "success");
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao criar perfil",
        "error"
      );
    }
  };

  const handleActivateProfile = async (profileId) => {
    try {
      const res = await API.put(`/auth/profiles/${profileId}/active`);

      syncUser(res.data.user);

      await loadFavorites();

      showToast("Perfil ativo alterado", "success");
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao alterar perfil",
        "error"
      );
    }
  };

  const openEditProfileModal = (profile) => {
    setEditProfileModal({
      open: true,
      profile,
      name: profile.name || "",
      avatarUrl: profile.avatarUrl || "",
      saving: false
    });
  };

  const closeEditProfileModal = () => {
    if (editProfileModal.saving) return;

    setEditProfileModal({
      open: false,
      profile: null,
      name: "",
      avatarUrl: "",
      saving: false
    });
  };

  const handleSaveEditedProfile = async () => {
    try {
      if (!editProfileModal.profile) return;

      if (!editProfileModal.name.trim()) {
        showToast("Digite o nome do perfil", "warning");
        return;
      }

      setEditProfileModal((prev) => ({
        ...prev,
        saving: true
      }));

      const res = await API.put(
        `/auth/profiles/${editProfileModal.profile.id}`,
        {
          name: editProfileModal.name,
          avatarUrl: editProfileModal.avatarUrl
        }
      );

      syncUser(res.data.user);

      setEditProfileModal({
        open: false,
        profile: null,
        name: "",
        avatarUrl: "",
        saving: false
      });

      showToast("Perfil atualizado", "success");
    } catch (err) {
      console.error(err);

      setEditProfileModal((prev) => ({
        ...prev,
        saving: false
      }));

      showToast(
        err.response?.data?.message || "Erro ao editar perfil",
        "error"
      );
    }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      const res = await API.delete(`/auth/profiles/${profileId}`);

      syncUser(res.data.user);

      await loadFavorites();

      showToast("Perfil removido", "success");
    } catch (err) {
      console.error(err);

      showToast(
        err.response?.data?.message || "Erro ao remover perfil",
        "error"
      );
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
        err.response?.data?.message || "Erro ao deletar conta",
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

        <style jsx>{styles}</style>
      </>
    );
  }

  const avatar = getAvatar();
  const profileLimit = user.isPremium ? 5 : 1;
  const favoriteLimitText = user.isPremium
    ? "Ilimitados"
    : `${favorites.length}/50`;

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

      {editProfileModal.open && (
        <div
          className="streaming-modal-overlay"
          onClick={closeEditProfileModal}
        >
          <div
            className="streaming-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-edit-side">
              <span>✏️</span>
            </div>

            <div className="modal-content">
              <span className="modal-tag premium">
                Editar perfil
              </span>

              <h2>{editProfileModal.profile?.name}</h2>

              <p>Altere o nome e o avatar deste perfil.</p>

              <input
                placeholder="Nome do perfil"
                value={editProfileModal.name}
                onChange={(e) =>
                  setEditProfileModal((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
              />

              <input
                placeholder="URL do avatar"
                value={editProfileModal.avatarUrl}
                onChange={(e) =>
                  setEditProfileModal((prev) => ({
                    ...prev,
                    avatarUrl: e.target.value
                  }))
                }
              />

              <div className="modal-actions">
                <button
                  className="modal-cancel"
                  onClick={closeEditProfileModal}
                  disabled={editProfileModal.saving}
                >
                  Cancelar
                </button>

                <button
                  className="modal-save"
                  onClick={handleSaveEditedProfile}
                  disabled={editProfileModal.saving}
                >
                  {editProfileModal.saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

                  <p>Digite sua senha para continuar.</p>

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
          <div
            className="premium-banner-profile"
            style={{
              backgroundImage:
                user.isPremium && user.premiumBannerUrl
                  ? `linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.25)), url(${user.premiumBannerUrl})`
                  : user.isPremium
                  ? "linear-gradient(135deg, #7a0006, #e50914)"
                  : "linear-gradient(135deg, #242424, #151515)"
            }}
          >
            <span>
              {user.isPremium ? "👑 Premium ativo" : "Plano gratuito"}
            </span>

            <h2>{getDisplayName()}</h2>

            <p>
              {user.isPremium
                ? "Favoritos ilimitados, até 5 perfis, avatar destacado e banner exclusivo."
                : "Grátis: 50 favoritos e 1 perfil. Ative premium para desbloquear mais."}
            </p>
          </div>

          <div className="profile-header-custom">
            <div
              className={
                user.isPremium
                  ? "profile-avatar-custom premium"
                  : "profile-avatar-custom"
              }
            >
              {avatar ? (
                <img src={avatar} alt="Foto de perfil" />
              ) : (
                <span>{getInitial()}</span>
              )}
            </div>

            <div>
              <span
                className={
                  user.isPremium
                    ? "profile-tag-custom premium"
                    : "profile-tag-custom"
                }
              >
                {user.isPremium ? "👑 Premium" : "Gratuito"}
              </span>

              <h1>Meu Perfil</h1>

              <p>{user.email}</p>
            </div>
          </div>

          <section className="profile-section-custom profiles-box">
            <div className="section-row">
              <div>
                <h2>Perfis</h2>
                <p>
                  {user.profiles?.length || 0}/{profileLimit} perfis
                </p>
              </div>
            </div>

            <div className="profiles-list">
              {user.profiles?.map((profile) => (
                <div
                  key={profile.id}
                  className={
                    String(profile.id) === String(user.activeProfileId)
                      ? "mini-profile active"
                      : "mini-profile"
                  }
                >
                  <button
                    className="mini-profile-main"
                    onClick={() => handleActivateProfile(profile.id)}
                  >
                    <div className="mini-avatar">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} />
                      ) : (
                        <span>{profile.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <strong>{profile.name}</strong>
                  </button>

                  <div className="mini-profile-actions">
                    <button
                      className="mini-edit"
                      onClick={() => openEditProfileModal(profile)}
                    >
                      Editar
                    </button>

                    {user.profiles.length > 1 && (
                      <button
                        className="mini-remove"
                        onClick={() => handleDeleteProfile(profile.id)}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="profile-create-grid">
              <input
                placeholder="Nome do novo perfil"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
              />

              <input
                placeholder="URL do avatar do perfil"
                value={profileForm.avatarUrl}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    avatarUrl: e.target.value
                  }))
                }
              />

              <button onClick={handleCreateProfile}>
                Criar perfil
              </button>
            </div>
          </section>

          <section className="favorites-section-custom top-favorites">
            <div className="section-row">
              <div>
                <h2>❤️ Favoritos</h2>
                <p>Limite: {favoriteLimitText}</p>
              </div>
            </div>

            {favorites.length === 0 && (
              <p className="empty-favorites-custom">
                Nenhum favorito ainda
              </p>
            )}

            {favorites.length > 0 && (
              <div className="favorites-grid-custom">
                {favorites.map((movie) => (
                  <Link
                    key={movie._id}
                    href={`/watch/${movie._id}`}
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
            )}
          </section>

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

              <label>URL da foto principal</label>

              <input
                value={form.avatarUrl}
                onChange={(e) =>
                  handleChange("avatarUrl", e.target.value)
                }
                placeholder="https://exemplo.com/foto.png"
              />

              {user.isPremium && (
                <>
                  <label>Banner exclusivo premium</label>

                  <input
                    value={form.premiumBannerUrl}
                    onChange={(e) =>
                      handleChange("premiumBannerUrl", e.target.value)
                    }
                    placeholder="https://exemplo.com/banner.jpg"
                  />
                </>
              )}

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
        </div>
      </div>

      <style jsx>{styles}</style>
    </>
  );
}

const styles = `
  .profile-page-custom {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 35px;
    background: linear-gradient(rgba(0,0,0,.6), rgba(20,20,20,1)), #141414;
  }

  .profile-card-custom {
    width: 100%;
    max-width: 1100px;
    background: #1b1b1b;
    border-radius: 18px;
    padding: 35px;
    box-shadow: 0 20px 70px rgba(0,0,0,.45);
  }

  .small-card {
    max-width: 450px;
    text-align: center;
  }

  .premium-banner-profile {
    min-height: 185px;
    border-radius: 18px;
    padding: 28px;
    margin-bottom: 28px;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 18px 50px rgba(0,0,0,.35);
  }

  .premium-banner-profile span {
    width: fit-content;
    background: rgba(255,211,106,.95);
    color: #1a1200;
    padding: 8px 13px;
    border-radius: 999px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .premium-banner-profile h2 {
    font-size: 2.4rem;
    margin-bottom: 8px;
  }

  .premium-banner-profile p {
    color: #eee;
    line-height: 1.5;
    max-width: 650px;
  }

  .profile-header-custom {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 30px;
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
    background: linear-gradient(135deg,#e50914,#7a0006);
    flex-shrink: 0;
  }

  .profile-avatar-custom.premium {
    box-shadow:
      0 0 0 3px #ffd36a,
      0 0 35px rgba(255,211,106,.45);
  }

  .profile-avatar-custom img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
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

  .profile-tag-custom.premium {
    background: linear-gradient(135deg,#ffd36a,#b8860b);
    color: #1a1200;
  }

  .profile-header-custom h1 {
    font-size: 2.4rem;
    margin-bottom: 8px;
  }

  .profile-header-custom p,
  .section-row p {
    color: #ccc;
  }

  .section-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 18px;
  }

  .profiles-box,
  .top-favorites {
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid #333;
  }

  .profile-section-custom {
    background: #242424;
    padding: 22px;
    border-radius: 15px;
  }

  .profile-section-custom h2,
  .favorites-section-custom h2 {
    margin-bottom: 8px;
  }

  .profiles-list {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .mini-profile {
    background: #151515;
    border: 1px solid #333;
    border-radius: 14px;
    overflow: hidden;
    min-width: 150px;
  }

  .mini-profile.active {
    border-color: #e50914;
  }

  .mini-profile-main {
    width: 100%;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    border-radius: 0;
  }

  .mini-avatar {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(135deg,#e50914,#7a0006);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mini-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .mini-profile-actions {
    display: flex;
  }

  .mini-edit {
    width: 100%;
    flex: 1;
    background: #2a2a2a;
    border-radius: 0;
    font-size: 12px;
  }

  .mini-remove {
    width: 100%;
    flex: 1;
    background: #7a0006;
    border-radius: 0;
    font-size: 12px;
  }

  .profile-create-grid {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 10px;
  }

  .profile-grid-custom {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 20px;
    margin-bottom: 25px;
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
    box-shadow: 0 0 0 2px rgba(229,9,20,.25);
  }

  .account-info-custom {
    display: grid;
    grid-template-columns: repeat(2,1fr);
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

  .profile-actions-custom {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  button {
    border: none;
    padding: 14px 18px;
    border-radius: 10px;
    cursor: pointer;
    color: white;
    font-weight: bold;
    transition: .2s;
    background: #333;
  }

  button:hover {
    opacity: .9;
    transform: translateY(-1px);
  }

  button:disabled {
    opacity: .65;
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

  .empty-favorites-custom {
    color: #aaa;
    background: #242424;
    padding: 18px;
    border-radius: 12px;
  }

  .favorites-grid-custom {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 8px;
    scrollbar-width: none;
  }

  .favorites-grid-custom::-webkit-scrollbar {
    display: none;
  }

  .favorite-card-custom {
    min-width: 155px;
    max-width: 155px;
    background: #242424;
    border-radius: 13px;
    overflow: hidden;
    text-decoration: none;
    color: white;
    transition: .2s;
    display: block;
    flex-shrink: 0;
  }

  .favorite-card-custom:hover {
    transform: scale(1.03);
  }

  .favorite-card-custom img,
  .favorite-placeholder-custom {
    width: 100%;
    height: 225px;
    object-fit: cover;
    display: block;
  }

  .favorite-placeholder-custom {
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
    color: white;
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
    background: rgba(0,0,0,.78);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .streaming-modal {
    width: 100%;
    max-width: 680px;
    background: linear-gradient(135deg,#242424,#111);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 18px;
    overflow: hidden;
    display: grid;
    grid-template-columns: 180px 1fr;
    box-shadow: 0 25px 80px rgba(0,0,0,.75);
  }

  .modal-danger-side,
  .modal-edit-side {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-danger-side {
    background: linear-gradient(180deg,#7a0006,#2a0002);
  }

  .modal-edit-side {
    background: linear-gradient(180deg,#e50914,#7a0006);
  }

  .modal-danger-side span,
  .modal-edit-side span {
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

  .modal-tag.premium {
    background: linear-gradient(135deg,#ffd36a,#b8860b);
    color: #1a1200;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 15px;
  }

  .modal-cancel,
  .modal-delete,
  .modal-save {
    flex: 1;
  }

  .modal-cancel {
    background: #444;
  }

  .modal-delete {
    background: #e50914;
  }

  .modal-save {
    background: #e50914;
  }

  .modal-delete:hover,
  .modal-save:hover {
    background: #ff1f1f;
  }

  @media (max-width: 768px) {
    .profile-page-custom {
      padding: 18px;
      align-items: flex-start;
    }

    .profile-card-custom {
      padding: 22px;
    }

    .premium-banner-profile {
      padding: 20px;
      min-height: 150px;
    }

    .premium-banner-profile h2 {
      font-size: 1.6rem;
    }

    .profile-header-custom {
      flex-direction: column;
      align-items: flex-start;
    }

    .profile-grid-custom,
    .profile-create-grid {
      grid-template-columns: 1fr;
    }

    .profile-actions-custom {
      flex-direction: column;
    }

    .account-info-custom {
      grid-template-columns: 1fr;
    }

    .favorite-card-custom {
      min-width: 130px;
      max-width: 130px;
    }

    .favorite-card-custom img,
    .favorite-placeholder-custom {
      height: 195px;
    }

    .streaming-modal {
      grid-template-columns: 1fr;
      max-width: 430px;
    }

    .modal-danger-side,
    .modal-edit-side {
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
`;