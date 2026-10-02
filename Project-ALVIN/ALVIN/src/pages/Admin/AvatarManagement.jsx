import { useEffect, useState } from "react";
import {
  Users,
  FileBarChart,
  UserCircle,
  Play,
  Mic,
  CheckCircle,
  User,
  X,
  Mail,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "/images/Alvin-logo.png";
import SignOutModal from "../../Components/SignOutModal";
import VoiceConfigModal from "../../Components/VoiceConfigModal";
import AvatarPreviewModal from "../../Components/AvatarPreviewModal";
import { supabase } from "../../lib/supabaseClient";

const navItems = [
  { id: "account", label: "Account" },
  { id: "users", label: "People", path: "/admin/users", icon: Users },
  { id: "reports", label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { id: "avatars", label: "Avatars", path: "/admin/avatars", icon: UserCircle },
];

const avatarModels = [
  {
    id: 1,
    name: "Tristan",
    image: "/images/Alvin.png",
    video: "/videos/tristan-preview.mp4",
    selected: true,
  },
  {
    id: 2,
    name: "Marcus",
    image: "/images/Alvin.png",
    video: "/videos/marcus-preview.mp4",
    selected: false,
  },
  {
    id: 3,
    name: "Elena",
    image: "/images/Alvin.png",
    video: "/videos/elena-preview.mp4",
    selected: false,
  },
  {
    id: 4,
    name: "Nova",
    image: "/images/Alvin.png",
    video: "/videos/nova-preview.mp4",
    selected: false,
  },
];

export default function AvatarManagement() {
  const [activeNav, setActiveNav] = useState("avatars");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [models, setModels] = useState(avatarModels);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeVoiceModel, setActiveVoiceModel] = useState(null);
  const [previewModel, setPreviewModel] = useState(null);
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

  const selectModel = (id) =>
    setModels((prev) => prev.map((m) => ({ ...m, selected: m.id === id })));

  const openVoiceModal = (model) => {
    setActiveVoiceModel(model);
    setIsVoiceModalOpen(true);
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    setActiveVoiceModel(null);
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
          modelName={activeVoiceModel?.name}
          onClose={closeVoiceModal}
          onUpdate={closeVoiceModal}
        />

        <AvatarPreviewModal
          isOpen={Boolean(previewModel)}
          model={previewModel}
          onClose={() => setPreviewModel(null)}
        />

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
                <h3 className="font-[Geist,Inter] text-2xl md:text-3xl font-bold tracking-tight mb-3 text-maroon">
                  Choose Avatar Model
                </h3>
                <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif] leading-6 mb-3">
                  Select the persona for next AI-driven interview session. Each
                  model has a distinct visual identity and conversational style.
                </p>
                {selected && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#862334]/15 bg-[#862334]/5 px-4 py-1.5 text-sm font-semibold text-[#862334]">
                    <CheckCircle className="h-5 w-5" />
                    Current Interviewer: {selected.name}
                  </div>
                )}
              </div>

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
                          <button
                            type="button"
                            onClick={() => setPreviewModel(model)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md opacity-90 transition-all duration-300 hover:bg-white/30 hover:opacity-100 cursor-pointer"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 md:p-5">
                      <button
                        type="button"
                        onClick={() => openVoiceModal(model)}
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
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}