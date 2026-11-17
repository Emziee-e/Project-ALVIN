import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Mic,
  CheckCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
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
const PROFILE_CACHE_KEY = "alvin_admin_profile_cache";

const buildProfileFromUser = (user) => {
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

  return {
    name: fullName,
    email: emailAddress,
    avatarUrl: avatar,
    initials,
  };
};

export default function AvatarManagement() {
  const [activeNav, setActiveNav] = useState("avatars");
  const [navAnimKey, setNavAnimKey] = useState(0);
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
    description: "",
  });
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarBeingEdited, setAvatarBeingEdited] = useState(null);
  const [editForm, setEditForm] = useState({
    avatar_name: "",
    avatar_id: "",
    avatar_image: "",
    voice: "",
    description: "",
  });
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore storage errors
    }
    return {
      name: "User",
      email: "",
      avatarUrl: null,
      initials: "U",
    };
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (user) => {
      if (!user || !isMounted) return;
      const nextProfile = buildProfileFromUser(user);
      setUserProfile(nextProfile);
      setImageError(false);
      try {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
      } catch {
        // Ignore storage errors
      }
    };

    const loadUserData = async () => {
      // 1. Instant local session read (no network round-trip)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        applyUser(session.user);
      }

      // 2. Background refresh for latest metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        applyUser(user);
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

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setToast((prev) => (prev ? { ...prev, closing: true } : null));
    toastTimerRef.current = setTimeout(() => setToast(null), 260);
  }, []);

  const showToast = useCallback(
    (title, message) => {
      clearTimeout(toastTimerRef.current);
      setToast({ title, message, id: Date.now(), closing: false });
      toastTimerRef.current = setTimeout(() => {
        dismissToast();
      }, 2740);
    },
    [dismissToast]
  );

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
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
    description: avatar.description || "",
    selected: avatar.is_active === true,
    updated_at: avatar.updated_at,
  });

  const loadAvatars = useCallback(async () => {
    setIsLoadingModels(true);
    setAvatarError("");
    try {
      const avatars = await apiRequest("/api/admin/avatars");
      setModels(
        Array.isArray(avatars)
          ? avatars
              .map(mapAvatar)
              .sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", undefined, {
                  sensitivity: "base",
                  numeric: true,
                })
              )
          : []
      );
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
      const addedName = avatarForm.avatar_name.trim();
      await apiRequest("/api/admin/avatars", {
        method: "POST",
        body: JSON.stringify(avatarForm),
      });
      setAvatarForm({
        avatar_name: "",
        avatar_id: "",
        avatar_image: "",
        voice: "",
        description: "",
      });
      setIsAvatarFormOpen(false);
      await loadAvatars();
      showToast("Avatar Added", `Avatar "${addedName}" was added successfully.`);
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
      const deletedName = avatarPendingDeletion.name;
      setModels((prev) =>
        prev.filter((item) => item.id !== avatarPendingDeletion.id)
      );
      setAvatarPendingDeletion(null);
      showToast("Avatar Deleted", `Avatar "${deletedName}" was deleted.`);
    } catch (error) {
      console.error("Unable to delete avatar:", error);
      setAvatarError(error.message || "Unable to delete avatar.");
    }
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
  };

  // Validates an image file and returns it as a data URL via onLoaded.
  const readAvatarImage = (event, onLoaded, onError) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError("Avatar images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onLoaded(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      onError("Unable to read the avatar image.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarImageChange = (event) => {
    readAvatarImage(
      event,
      (dataUrl) => setAvatarForm((current) => ({ ...current, avatar_image: dataUrl })),
      setAvatarError
    );
  };

  const handleEditImageChange = (event) => {
    setEditError("");
    readAvatarImage(
      event,
      (dataUrl) => setEditForm((current) => ({ ...current, avatar_image: dataUrl })),
      setEditError
    );
  };

  const openEditModal = (model) => {
    setEditError("");
    setEditForm({
      avatar_name: model.name,
      avatar_id: model.avatar_id,
      avatar_image: "", // empty = keep the current thumbnail
      voice: model.voice || "",
      description: model.description || "",
    });
    setAvatarBeingEdited(model);
  };

  const closeEditModal = () => {
    if (isSavingEdit) return;
    setAvatarBeingEdited(null);
    setEditError("");
  };

  const saveAvatarEdit = async (event) => {
    event.preventDefault();
    if (!avatarBeingEdited) return;

    const name = editForm.avatar_name.trim();
    const newId = editForm.avatar_id.trim();
    if (!name || !newId) {
      setEditError("Avatar name and avatar ID are required.");
      return;
    }

    // Only send what actually changed.
    const body = {};
    if (name !== avatarBeingEdited.name) body.avatar_name = name;
    if (newId !== avatarBeingEdited.avatar_id) body.avatar_id = newId;
    if (editForm.avatar_image) body.avatar_image = editForm.avatar_image;
    const newVoice = editForm.voice.trim();
    if (newVoice !== (avatarBeingEdited.voice || "")) body.voice = newVoice; // "" clears it
    const newDescription = editForm.description.trim();
    if (newDescription !== (avatarBeingEdited.description || "")) {
      body.description = newDescription; // "" clears it
    }

    if (Object.keys(body).length === 0) {
      setAvatarBeingEdited(null);
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      await apiRequest(
        `/api/admin/avatars/${encodeURIComponent(avatarBeingEdited.avatar_id)}`,
        { method: "PATCH", body: JSON.stringify(body) }
      );
      setAvatarBeingEdited(null);
      await loadAvatars();
      showToast("Avatar Updated", `Avatar "${name}" was updated successfully.`);
    } catch (error) {
      console.error("Unable to update avatar:", error);
      setEditError(error.message || "Unable to update avatar.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const selected = models.find((m) => m.selected);

  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; width: 100%; }
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(16px);
          }
        }
        @keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes itemFadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-item-in {
          opacity: 0;
          animation: itemFadeSlideIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
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

        {/* Confirmation toast matching AccountActionToast */}
        {toast && (
          <aside
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`fixed bottom-4 right-4 z-[1100] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ${
              toast.closing
                ? "motion-safe:animate-[toast-slide-out_260ms_cubic-bezier(0.4,0,1,1)_forwards]"
                : "motion-safe:animate-[toast-slide-in_320ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
            }`}
          >
            <div className="flex gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#16A34A]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-Geist text-sm font-bold text-gray-900">{toast.title}</p>
                <p className="mt-1 font-Inter text-xs leading-5 text-gray-500">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="Dismiss notification"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1C2C] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              key={toast.id}
              className="h-1 origin-left bg-[#16A34A] motion-safe:animate-[toast-progress_3s_linear_forwards]"
            />
          </aside>
        )}

        {/* Delete Confirmation Modal (SignOutModal style) */}
        {avatarPendingDeletion && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
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
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Close Button - Overlapping */}
              <button
                type="button"
                onClick={() => setAvatarPendingDeletion(null)}
                aria-label="Close delete avatar dialog"
                className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] cursor-pointer"
              >
                <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Header/Icon */}
              <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                  <Trash2 className="w-6 h-6 text-maroon" aria-hidden="true" />
                </div>
                <h2 id="delete-avatar-title" className="text-xl font-bold text-gray-900 font-Geist">
                  Delete Avatar
                </h2>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 text-center">
                <p className="text-sm text-gray-600 mb-6 font-Inter leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{avatarPendingDeletion.name}"</span>? This action cannot be undone.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setAvatarPendingDeletion(null)}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={deleteModel}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Delete Avatar
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Edit Avatar Modal (SignOutModal style) */}
        {avatarBeingEdited && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-avatar-title"
            onClick={closeEditModal}
          >
            <form
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100"
              onSubmit={saveAvatarEdit}
              onClick={(event) => event.stopPropagation()}
            >
              {/* Close Button - Overlapping */}
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit avatar dialog"
                className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] cursor-pointer"
              >
                <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Header/Icon */}
              <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                  <Pencil className="w-6 h-6 text-maroon" aria-hidden="true" />
                </div>
                <h2 id="edit-avatar-title" className="text-xl font-bold text-gray-900 font-Geist">
                  Edit Avatar
                </h2>
                <p className="mt-1 text-sm text-gray-600 font-Inter">
                  Update the details for {avatarBeingEdited.name}.
                </p>
              </div>

              {/* Form Fields */}
              <div className="px-6 pb-6 pt-3 space-y-4 max-h-[75vh] overflow-y-auto">
                {editError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-Inter">
                    {editError}
                  </p>
                )}

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar Name
                  </span>
                  <input
                    required
                    value={editForm.avatar_name}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        avatar_name: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. Tristan"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar Thumbnail
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-600 font-Inter file:mr-3 file:rounded-xl file:border-0 file:bg-maroon/10 file:px-3 file:py-1.5 file:font-semibold file:text-maroon hover:file:bg-maroon/15 cursor-pointer"
                  />
                  <img
                    src={editForm.avatar_image || avatarBeingEdited.image}
                    alt="Avatar thumbnail preview"
                    className="h-24 w-full rounded-2xl object-cover border border-gray-100"
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter">
                    {editForm.avatar_image
                      ? "New thumbnail selected. It will replace the current one when you save."
                      : "Leave empty to keep the current thumbnail."}
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar ID
                  </span>
                  <input
                    required
                    value={editForm.avatar_id}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        avatar_id: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="NavTalk avatar ID"
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter leading-relaxed">
                    Only change this to match the ID shown in the NavTalk Avatars
                    Dashboard. A wrong ID will stop interviews from starting with
                    this avatar.
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Voice
                  </span>
                  <input
                    value={editForm.voice}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        voice: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. marin"
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter leading-relaxed">
                    Enter the voice set for this avatar in the NavTalk Console so
                    it stays the same throughout the interview.
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Description
                  </span>
                  <textarea
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    maxLength={500}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. Janine is an HR Manager who values soft skills such as communication and teamwork."
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter leading-relaxed">
                    A short, general description shown on the avatar card. It
                    is for display only and does not change how the avatar
                    behaves. ({editForm.description.length}/500)
                  </span>
                </label>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSavingEdit}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Add Avatar Modal (SignOutModal style) */}
        {isAvatarFormOpen && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-avatar-title"
            onClick={() => setIsAvatarFormOpen(false)}
          >
            <form
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100"
              onSubmit={addAvatar}
              onClick={(event) => event.stopPropagation()}
            >
              {/* Close Button - Overlapping */}
              <button
                type="button"
                onClick={() => setIsAvatarFormOpen(false)}
                aria-label="Close add avatar dialog"
                className="absolute -top-4 -right-4 p-2.5 rounded-full bg-white shadow-xl group hover:scale-110 transition-all border border-gray-100 z-[1001] cursor-pointer"
              >
                <X className="w-5 h-5 text-maroon group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Header/Icon */}
              <div className="pt-6 pb-2 px-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-maroon" aria-hidden="true" />
                </div>
                <h2 id="add-avatar-title" className="text-xl font-bold text-gray-900 font-Geist">
                  Add Avatar
                </h2>
                <p className="mt-1 text-sm text-gray-600 font-Inter">
                  Enter the avatar details from NavTalk.
                </p>
              </div>

              {/* Form Fields */}
              <div className="px-6 pb-6 pt-3 space-y-4 max-h-[75vh] overflow-y-auto">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar Name
                  </span>
                  <input
                    required
                    value={avatarForm.avatar_name}
                    onChange={(event) =>
                      setAvatarForm((current) => ({
                        ...current,
                        avatar_name: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. Tristan"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar Thumbnail
                  </span>
                  <input
                    required
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarImageChange}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-gray-600 font-Inter file:mr-3 file:rounded-xl file:border-0 file:bg-maroon/10 file:px-3 file:py-1.5 file:font-semibold file:text-maroon hover:file:bg-maroon/15 cursor-pointer"
                  />
                  {avatarForm.avatar_image && (
                    <img
                      src={avatarForm.avatar_image}
                      alt="Avatar thumbnail preview"
                      className="h-24 w-full rounded-2xl object-cover border border-gray-100"
                    />
                  )}
                </label>

                <label className="block space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Avatar ID
                    <span
                      className="group relative inline-flex"
                      title="The Avatar ID is only available in the NavTalk Avatar Dashboard."
                    >
                      <HelpCircle
                        className="h-3.5 w-3.5 cursor-help text-gray-400 transition-colors group-hover:text-maroon"
                        aria-label="Avatar ID reminder"
                      />
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-60 -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-2 text-center text-[11px] font-normal normal-case tracking-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
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
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="NavTalk avatar ID"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
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
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. marin"
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter leading-relaxed">
                    Enter the voice set for this avatar in the NavTalk Console so
                    it stays the same throughout the interview.
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-Inter">
                    Description
                  </span>
                  <textarea
                    value={avatarForm.description}
                    onChange={(event) =>
                      setAvatarForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    maxLength={500}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-Inter outline-none transition focus:border-maroon/50 focus:bg-white focus:ring-2 focus:ring-maroon/10"
                    placeholder="e.g. Janine is an HR Manager who values soft skills such as communication and teamwork."
                  />
                  <span className="block text-[11px] text-gray-400 font-Inter leading-relaxed">
                    A short, general description shown on the avatar card. It
                    is for display only and does not change how the avatar
                    behaves. ({avatarForm.description.length}/500)
                  </span>
                </label>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAvatarFormOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAvatar}
                    className="flex-1 px-4 py-2.5 rounded-2xl font-bold text-sm text-white bg-maroon hover:bg-maroon/90 shadow-lg hover:shadow-maroon/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingAvatar ? "Adding..." : "Add Avatar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Slide-out Account Drawer Wrapper with Transitions */}
        <div
          className={`fixed inset-0 z-40 flex transition-opacity duration-150 ${
            isAccountOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/10 transition-opacity duration-150"
            onClick={() => setIsAccountOpen(false)}
          />

          {/* Animated Drawer Panel */}
          <aside
            className={`relative left-[100px] w-[340px] h-full bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col overflow-y-auto select-none font-sans text-[#2D3B45] transition-transform duration-150 ease-out ${
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
                  loading="eager"
                  decoding="async"
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
        <aside className="w-[100px] bg-[#FDFBF7] border-r-1 border-[#862334] flex flex-col justify-between items-center pt-2 pb-4 flex-shrink-0 select-none h-screen z-50 relative">
          <div className="w-full flex flex-col items-center">
            <div
              className="mb-3 px-1 flex flex-col items-center cursor-pointer"
              onClick={() => {
                setIsAccountOpen(false);
                setActiveNav("avatars");
                setNavAnimKey((prev) => prev + 1);
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
                        setNavAnimKey((prev) => prev + 1);
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
                      className={`text-xs tracking-tight ${
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
            <div
              key={`${activeNav}-${navAnimKey}`}
              className="px-12 sm:px-16 md:px-20 lg:px-28 py-8 space-y-8 w-full"
            >
              <div
                style={{ animationDelay: "0ms" }}
                className="animate-item-in space-y-2"
              >
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
                  <div
                    style={{ animationDelay: "100ms" }}
                    className="animate-item-in inline-flex items-center gap-2 rounded-full border border-[#862334]/15 bg-[#862334]/5 px-4 py-1.5 text-sm font-semibold text-[#862334]"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Current Interviewer: {selected.name}
                  </div>
                )}
              </div>

              {avatarError && (
                <p className="animate-item-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {avatarError}
                </p>
              )}

              {isLoadingModels ? (
                <p className="py-12 text-center text-sm text-slate-500">Loading avatars...</p>
              ) : models.length === 0 ? (
                <p
                  style={{ animationDelay: "160ms" }}
                  className="animate-item-in rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500"
                >
                  No avatars configured yet. Add a NavTalk avatar to get started.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {models.map((model, idx) => (
                    <article
                      key={model.id}
                      style={{ animationDelay: `${Math.min(160 + idx * 110, 900)}ms` }}
                      className={`animate-item-in group overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out ${
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
                        {model.description ? (
                          <p className="max-h-24 overflow-y-auto whitespace-pre-line break-words pr-1 text-sm leading-relaxed text-slate-600 font-Inter [scrollbar-width:thin]">
                            {model.description}
                          </p>
                        ) : null}

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
                          disabled={model.selected}
                          aria-disabled={model.selected}
                          className="flex w-full items-center justify-center rounded-xl bg-maroon px-4 py-3 text-sm font-Geist text-white shadow-[0_10px_20px_rgba(15,76,92,0.18)] transition-all duration-300 hover:bg-[#862334] hover:shadow-[0_14px_26px_rgba(134,35,52,0.25)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-maroon disabled:hover:shadow-none"
                          title={model.selected ? "This avatar is already selected for the session" : "Select for session"}
                        >
                          {model.selected ? "Selected for Session" : "Select for Session"}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(model)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#862334]/30 px-4 py-3 text-sm font-semibold text-[#862334] transition-colors hover:bg-[#862334]/10 cursor-pointer"
                            title="Edit avatar"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteModel(model)}
                            disabled={model.selected}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title={model.selected ? "Select another avatar before deleting this avatar" : "Delete avatar"}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
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