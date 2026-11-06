import { useCallback, useEffect, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Mic,
  CheckCircle,
  Plus,
  Trash2,
  User,
  X,
  Mail,
  HelpCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import VoiceConfigModal from "../../Components/VoiceConfigModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const APP_API_KEY = import.meta.env.VITE_APP_API_KEY || "";
const DEFAULT_AVATAR_IMAGE = "/images/Alvin.png";

export default function AvatarManagement() {
  const [activeNav, setActiveNav] = useState("avatars");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [avatarError, setAvatarError] = useState("");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAvatarFormOpen, setIsAvatarFormOpen] = useState(false);
  const [avatarPendingDeletion, setAvatarPendingDeletion] = useState(null);
  const [avatarForm, setAvatarForm] = useState({
    avatar_name: "",
    avatar_id: "",
    avatar_image: "",
    voice: "",
  });
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState({
    name: "User",
    email: "",
    avatarUrl: null,
    initials: "U",
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isMounted) {
        const metadata = user.user_metadata || {};
        const fullName =
          metadata.full_name ||
          metadata.name ||
          `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
          user.email?.split("@")[0] ||
          "User Account";

        const emailAddress = user.email || metadata.email || "N/A";
        const avatar =
          metadata.avatar_url ||
          metadata.picture ||
          user.identities?.[0]?.identity_data?.avatar_url ||
          user.identities?.[0]?.identity_data?.picture ||
          null;

        const nameParts = fullName.split(" ").filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        setUserProfile({
          name: fullName,
          email: emailAddress,
          avatarUrl: avatar,
          initials: initials,
        });
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/users")) {
      setActiveNav("users");
    } else if (location.pathname.includes("/reports")) {
      setActiveNav("reports");
    } else {
      setActiveNav("avatars");
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const apiRequest = useCallback(async (path, options = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: session?.access_token
          ? `Bearer ${session.access_token}`
          : "",
        "X-API-Key": APP_API_KEY,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${response.status})`);
    }

    return response.json();
  }, []);

  const mapAvatar = (avatar) => ({
    id: avatar.avatar_id,
    avatar_id: avatar.avatar_id,
    name: avatar.avatar_name,
    image: avatar.avatar_image || DEFAULT_AVATAR_IMAGE,
    voice: avatar.voice || "",
    selected: avatar.is_active === true,
    updated_at: avatar.updated_at,
  });

  const loadAvatars = useCallback(async () => {
    setIsLoadingModels(true);
    setAvatarError("");
    try {
      const avatars = await apiRequest("/api/admin/avatars");
      setModels(Array.isArray(avatars) ? avatars.map(mapAvatar) : []);
    } catch (error) {
      console.error("Unable to load avatars:", error);
      setAvatarError(error.message || "Unable to load avatars.");
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    queueMicrotask(loadAvatars);
  }, [loadAvatars]);

  const selectModel = async (id) => {
    setAvatarError("");
    try {
      await apiRequest(`/api/admin/avatars/${encodeURIComponent(id)}/select`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      setModels((prev) =>
        prev.map((model) => ({ ...model, selected: model.id === id }))
      );
    } catch (error) {
      console.error("Unable to select avatar:", error);
      setAvatarError(error.message || "Unable to select avatar.");
    }
  };

  const addAvatar = async (event) => {
    event.preventDefault();
    setIsSavingAvatar(true);
    setAvatarError("");
    try {
      await apiRequest("/api/admin/avatars", {
        method: "POST",
        body: JSON.stringify(avatarForm),
      });
      setAvatarForm({ avatar_name: "", avatar_id: "", avatar_image: "", voice: "" });
      setIsAvatarFormOpen(false);
      await loadAvatars();
    } catch (error) {
      console.error("Unable to add avatar:", error);
      setAvatarError(error.message || "Unable to add avatar.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const requestDeleteModel = (model) => {
    if (!model.selected) {
      setAvatarPendingDeletion(model);
    }
  };

  const deleteModel = async () => {
    if (!avatarPendingDeletion) return;

    setAvatarError("");
    try {
      await apiRequest(
        `/api/admin/avatars/${encodeURIComponent(avatarPendingDeletion.id)}`,
        {
          method: "DELETE",
        }
      );
      setModels((prev) =>
        prev.filter((item) => item.id !== avatarPendingDeletion.id)
      );
      setAvatarPendingDeletion(null);
    } catch (error) {
      console.error("Unable to delete avatar:", error);
      setAvatarError(error.message || "Unable to delete avatar.");
    }
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
  };

  const handleAvatarImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarForm((current) => ({
        ...current,
        avatar_image: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.onerror = () => {
      setAvatarError("Unable to read the avatar image.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const selected = models.find((m) => m.selected);

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Geist, Inter] relative">
        {/* Modals */}
        <SignOutModal
          isOpen={isSignOutModalOpen}
          onClose={() => setIsSignOutModalOpen(false)}
          onConfirm={handleSignOut}
        />

        <VoiceConfigModal
          isOpen={isVoiceModalOpen}
          onClose={closeVoiceModal}
        />

        {/* Delete Confirmation Modal */}
        {avatarPendingDeletion && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-avatar-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setAvatarPendingDeletion(null);
              }
            }}
          >
            <section
              className="relative w-full max-w-md rounded-[28px] border border-gray-200 bg-white p-6 shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setAvatarPendingDeletion(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close delete avatar dialog"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 id="delete-avatar-title" className="pr-10 text-2xl font-bold text-slate-900">
                Delete Avatar
              </h2>
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">
                Are you sure you want to delete "{avatarPendingDeletion.name}"? This action cannot be undone.
              </p>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAvatarPendingDeletion(null)}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteModel}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                >
                  Delete Avatar
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Add Avatar Modal */}
        {isAvatarFormOpen && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-avatar-title"
            onClick={() => setIsAvatarFormOpen(false)}
          >
            <form
              className="relative w-full max-w-md space-y-5 rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
              onSubmit={addAvatar}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsAvatarFormOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close add avatar dialog"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h2 id="add-avatar-title" className="text-xl font-bold text-slate-900">
                  Add Avatar
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the avatar details from NavTalk.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Avatar Name</span>
                <input
                  required
                  value={avatarForm.avatar_name}
                  onChange={(event) =>
                    setAvatarForm((current) => ({
                      ...current,
                      avatar_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#862334]/50 focus:ring-4 focus:ring-[#862334]/10"
                  placeholder="e.g. Tristan"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Avatar Thumbnail</span>
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarImageChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#862334]/10 file:px-3 file:py-2 file:font-semibold file:text-[#862334] hover:file:bg-[#862334]/15"
                />
                {avatarForm.avatar_image && (
                  <img
                    src={avatarForm.avatar_image}
                    alt="Avatar thumbnail preview"
                    className="h-24 w-full rounded-xl object-cover"
                  />
                )}
              </label>

              <label className="block space-y-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  Avatar ID
                  <span
                    className="group relative inline-flex"
                    title="The Avatar ID is only available in the NavTalk Avatar Dashboard."
                  >
                    <HelpCircle
                      className="h-4 w-4 cursor-help text-slate-400 transition-colors group-hover:text-[#862334]"
                      aria-label="Avatar ID reminder"
                    />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      The Avatar ID is only available in the NavTalk Avatars Dashboard.
                    </span>
                  </span>
                </span>
                <input
                  required
                  value={avatarForm.avatar_id}
                  onChange={(event) =>
                    setAvatarForm((current) => ({
                      ...current,
                      avatar_id: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#862334]/50 focus:ring-4 focus:ring-[#862334]/10"
                  placeholder="NavTalk avatar ID"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Voice
                </span>
                <input
                  value={avatarForm.voice}
                  onChange={(event) =>
                    setAvatarForm((current) => ({
                      ...current,
                      voice: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#862334]/50 focus:ring-4 focus:ring-[#862334]/10"
                  placeholder="e.g. marin"
                />
                <span className="block text-xs text-slate-500">
                  Enter the voice set for this avatar in the NavTalk Console so
                  it stays the same throughout the interview.
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAvatarFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAvatar}
                  className="rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-white hover:bg-[#862334] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAvatar ? "Adding..." : "Add Avatar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slide-out Account Drawer Wrapper with Transitions */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-300 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-300"
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Animated Drawer Panel */}
          <aside
            className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transition-transform duration-300 ease-in-out ${
              isAccountOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsAccountOpen(false)}
                className="p-1.5 rounded-lg border border-[#862334] text-[#862334] hover:bg-[#862334]/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center pt-2 pb-6 px-6">
              {userProfile.avatarUrl && !imageError ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  onError={() => setImageError(true)}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#862334] shadow-sm mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-[#862334] flex items-center justify-center text-[#862334] font-semibold text-2xl mb-3 bg-white shadow-xs">
                  {userProfile.initials}
                </div>
              )}

              <h2 className="text-xl font-bold text-[#2D3B45] text-center tracking-tight">
                {userProfile.name}
              </h2>

              <button
                onClick={() => {
                  setIsAccountOpen(false);
                  setIsSignOutModalOpen(true);
                }}
                className="mt-3 px-4 py-1 bg-[#F5F5F5] hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-[#2D3B45] transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>

            <div className="px-6 my-1">
              <hr className="border-t border-gray-200" />
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-[#862334] rounded-lg mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="text-sm font-medium text-[#2D3B45] break-all">
                    {userProfile.email || "Not Available"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Canvas-style Vertical Navigation Sidebar */}
        <aside className="w-[100px] bg-[#FDFBF7] border-r border-[#EAE5D9] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 z-50 select-none h-screen">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("avatars");
                navigate("/admin/avatars");
              }}
            >
              <img
                src={Logo}
                alt="Alvin Logo"
                className="w-20 h-20 object-contain hover:scale-105 transition-transform"
              />
            </div>

            <nav className="w-full flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.id === "account" ? User : item.icon;

                const isSolidActive = isAccountOpen
                  ? item.id === "account"
                  : activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "account") {
                        setIsAccountOpen(!isAccountOpen);
                      } else {
                        setIsAccountOpen(false);
                        setActiveNav(item.id);
                        if (item.path) navigate(item.path);
                      }
                    }}
                    className={`w-full py-3.5 px-2 flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
                      isSolidActive
                        ? "bg-[#862334] text-white"
                        : "text-[#862334] hover:bg-[#862334]/10 bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        isSolidActive ? "text-white" : "text-[#862334]"
                      }`}
                    />
                    <span
                      className={`text-[11px] tracking-tight ${
                        isSolidActive
                          ? "font-bold text-white"
                          : "font-medium text-[#862334]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 w-full bg-white overflow-hidden flex flex-col h-screen min-w-0">
          <div className="flex-1 overflow-y-auto w-full">
            {/* Same generous padding as User Management and System Report */}
            <div className="px-12 sm:px-16 md:px-20 lg:px-28 py-8 space-y-8 w-full">
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-[Geist,Inter] text-2xl md:text-3xl font-bold tracking-tight mb-3 text-maroon">
                      Choose Avatar Model
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif] leading-6 mb-3">
                      Select the persona for next AI-driven interview session. Each
                      model has a distinct visual identity and conversational style.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarFormOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-maroon px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#862334]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Avatar
                  </button>
                </div>
                {selected && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#862334]/15 bg-[#862334]/5 px-4 py-1.5 text-sm font-semibold text-[#862334]">
                    <CheckCircle className="h-5 w-5" />
                    Current Interviewer: {selected.name}
                  </div>
                )}
              </div>

              {avatarError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {avatarError}
                </p>
              )}

              {isLoadingModels ? (
                <p className="py-12 text-center text-sm text-slate-500">Loading avatars...</p>
              ) : models.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
                  No avatars configured yet. Add a NavTalk avatar to get started.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {models.map((model) => (
                    <article
                      key={model.id}
                      className={`group overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out ${
                        model.selected
                          ? "border-[#862334] ring-1 ring-[#862334]/20"
                          : "border-[#e8e8e8]"
                      } hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.16)] hover:border-[#862334]/40`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                        <img
                          src={model.image}
                          alt={model.name}
                          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/18 to-transparent transition-opacity duration-300 group-hover:from-black/70 group-hover:via-black/10" />

                        {model.selected ? (
                          <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#862334] text-white shadow-lg">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        ) : null}

                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                          <div className="flex w-full min-w-0 items-center justify-between gap-2">
                            <p className="truncate text-lg font-bold text-white md:text-xl">
                              {model.name}
                            </p>
                            {model.voice ? (
                              <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold capitalize text-white backdrop-blur">
                                {model.voice}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 md:p-5">
                        <button
                          type="button"
                          onClick={() => setIsVoiceModalOpen(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#862334]/15 bg-[#f7fbfc] px-4 py-3 text-sm font-Geist text-maroon transition-all duration-300 hover:border-[#862334]/25 hover:bg-[#eef7f8] cursor-pointer"
                        >
                          <Mic className="h-4 w-4 text-maroon" />
                          Configure Voice
                        </button>

                        <button
                          type="button"
                          onClick={() => selectModel(model.id)}
                          className="flex w-full items-center justify-center rounded-xl bg-maroon px-4 py-3 text-sm font-Geist text-white shadow-[0_10px_20px_rgba(15,76,92,0.18)] transition-all duration-300 hover:bg-[#862334] hover:shadow-[0_14px_26px_rgba(134,35,52,0.25)] cursor-pointer"
                        >
                          Select for Session
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteModel(model)}
                          disabled={model.selected}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={model.selected ? "Select another avatar before deleting this avatar" : "Delete avatar"}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Avatar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}