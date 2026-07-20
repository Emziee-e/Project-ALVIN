import { useEffect, useState } from "react";
import { Users, FileBarChart, UserCircle, Play, Mic, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';
import SignOutModal from '../../Components/SignOutModal';
import VoiceConfigModal from '../../Components/VoiceConfigModal';
import AvatarPreviewModal from '../../Components/AvatarPreviewModal';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { icon: Users, label: "User Management" },
  { icon: FileBarChart, label: "System Report" },
  { icon: UserCircle, label: "Avatar" },
];

const footerLinks = [
  { icon: "terminal",    label: "System Logs" },
  { icon: "help_center", label: "Support"     },
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
  const [activeNav, setActiveNav] = useState(2); // Avatars active
  const [models, setModels] = useState(avatarModels);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeVoiceModel, setActiveVoiceModel] = useState(null);
  const [previewModel, setPreviewModel] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadUserAvatar = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      const metadata = user?.user_metadata ?? {};
      const nextAvatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        metadata.avatar ||
        metadata.image ||
        "";

      if (isMounted) {
        setAvatarUrl(nextAvatarUrl);
      }
    };

    loadUserAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const selectModel = (id) =>
    setModels(prev => prev.map(m => ({ ...m, selected: m.id === id })));

  const openVoiceModal = (model) => {
    setActiveVoiceModel(model);
    setIsVoiceModalOpen(true);
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    setActiveVoiceModel(null);
  };

  const selected = models.find(m => m.selected);

  return (
    <>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-6 px-4 flex items-center justify-center gap-0">
            <img src={Logo} alt="Alvin logo" className="h-12 w-auto flex-shrink-0 block" />
            <div className="flex h-12 items-center text-maroon font-Geist text-[46px] leading-none tracking-[-0.05em] uppercase whitespace-nowrap">
              LVIN
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              {navItems.map((item, i) => {
                const isUserMgmt = i === 0;
                const isSystemReport = i === 1;
                const isAvatarMgmt = i === 2;
                let navLink = '#';

                if (isUserMgmt) navLink = '/admin/users';
                if (isSystemReport) navLink = '/admin/reports';
                if (isAvatarMgmt) navLink = '/admin/avatars';

                return (
                  <li key={item.label}
                    className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                  >
                    <Link
                      to={navLink}
                      onClick={() => setActiveNav(i)}
                      className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                        ${activeNav === i
                          ? "text-[#862334]"
                          : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign Out CTA */}
          <div className="mt-auto">
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Modal */}
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

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen min-w-0">

          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-100">
            </div>
            <div className="flex items-center gap-6">
              {avatarUrl && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </header>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="px-4 md:px-6 lg:px-8 py-8 md:py-10 flex-1">
              <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-2">
                  <h3 className="font-[Geist,Inter] text-2xl md:text-3xl font-bold tracking-tight mb-3 text-maroon">
                    Choose Avatar Model
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 font-[Inter,sans-serif] leading-6 mb-3">
                    Select the persona for next AI-driven interview session. Each model has a distinct visual identity and conversational style.
                  </p>
                  {selected && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#862334]/15 bg-[#862334]/5 px-4 py-1.5 text-sm font-semibold text-[#862334]">
                      <CheckCircle className="h-5 w-5" />
                      Current Interviewer: {selected.name}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {models.map(model => (
                    <article
                      key={model.id}
                      className={`group overflow-hidden rounded-2xl border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out ${model.selected ? "border-[#862334] ring-1 ring-[#862334]/20" : "border-[#e8e8e8]"} hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.16)] hover:border-[#862334]/40`}
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
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md opacity-90 transition-all duration-300 hover:bg-white/30 hover:opacity-100"
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
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#862334]/15 bg-[#f7fbfc] px-4 py-3 text-sm font-Geist text-maroon transition-all duration-300 hover:border-[#862334]/25 hover:bg-[#eef7f8]"
                        >
                          <Mic className="h-4 w-4 text-maroon" />
                          Configure Voice
                        </button>

                        <button
                          type="button"
                          onClick={() => selectModel(model.id)}
                          className="flex w-full items-center justify-center rounded-xl bg-maroon px-4 py-3 text-sm font-Geist text-white shadow-[0_10px_20px_rgba(15,76,92,0.18)] transition-all duration-300 hover:bg-[#862334] hover:shadow-[0_14px_26px_rgba(134,35,52,0.25)]"
                        >
                          Select for Session
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
