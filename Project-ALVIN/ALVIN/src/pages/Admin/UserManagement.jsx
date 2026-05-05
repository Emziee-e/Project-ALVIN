import { useState } from "react";
import { Users, FileBarChart, UserCircle, LogOut, Search, ChevronLeft, ChevronRight, User, Filter, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';

const navItems = [
  { icon: Users, label: "User Management" },
  { icon: FileBarChart, label: "System Report" },
  { icon: UserCircle, label: "Avatar Management" },
];

const initialAccounts = [
  { name: "John Manuel Policarpio III",     email: "1111111@ub.edu.ph",  role: "Staff", active: true,  date: "Oct 12, 2023", primary: true  },
  { name: "John Ashley Alday",     email: "2222222@ub.edu.ph",    role: "User",  active: false, date: "Jan 05, 2024", primary: false },
  { name: "Vin Vernon Perez",email: "3333333@ub.edu.ph",  role: "User", active: true,  date: "Nov 22, 2023", primary: false },
  { name: "Tristan Jay Mirano",       email: "4444444@ub.edu.ph", role: "User",  active: true,  date: "Feb 14, 2024", primary: false },
];

const TOTAL    = initialAccounts.length;
const PER_PAGE = 5;
const PAGES    = Math.ceil(TOTAL / PER_PAGE);

export default function UserManagement() {
  const [activeNav, setActiveNav] = useState(0);
  const [accounts,    setAccounts]    = useState(initialAccounts);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [roleFilter,  setRoleFilter]  = useState("All Roles");

  const filtered = accounts.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                         a.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedAccounts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalFilteredPAGES = Math.ceil(filtered.length / PER_PAGE);

  const deleteAccount = (email) =>
    setAccounts(prev => prev.filter(a => a.email !== email));

  return (
    <>
      <style> {`
                html, body, #root { height: 100%; margin: 0; width: 100%; }
            `}
        </style>

      <div className="flex h-screen w-full overflow-hidden bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex fixed w-60 lg:w-64 h-screen left-0 top-0 bg-[#f9f9f9] border-r border-[#e5e5e5] flex-col py-8 px-4 z-50 overflow-y-auto">

          {/* Logo */}
          <div className="mb-6 px-4 flex flex-col items-center">
            <img src={Logo} alt="Alvin logo" className="mb-[-10px] h-24" />
            <div className="text-center text-maroon text-[2.25rem] font-Geist text-xl tracking-[-0.05em] uppercase">
              ALVIN
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
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen min-w-0">

          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-2 text-xs font-[Inter,sans-serif] opacity-100">
              <span className=" text-[#862334] font-Geist opacity-100">User Management</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto w-full">
            <section className="p-4 md:p-8 lg:p-10 flex-1">

            {/* Hero Header */}
            <div className="mb-8 md:mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
              <div>
                <h2 className="text-left font-Geist text-4xl md:text-6xl font-black tracking-tight text-black uppercase mb-2">
                  User Management
                </h2>
                <p className="font-Inter text-gray-600 max-w-md text-sm md:text-base">
                  Control user accounts and permissions.
                </p>
              </div>
            </div>

            {/* ── Bento Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

              {/* ── Main Table ── */}
              <div className="md:col-span-12 bg-white border border-gray-200 relative overflow-hidden rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-Geist text-lg font-bold text-black uppercase">
                    User Directory
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Role Filter Dropdown */}
                    <div className="relative group w-full sm:w-40">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                      <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        className="w-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider py-2.5 pl-9 pr-8 outline-none focus:ring-1 focus:ring-[#862334] appearance-none rounded cursor-pointer text-gray-600 transition-all font-Inter"
                      >
                        <option value="All Roles">All Roles</option>
                        <option value="Staff">Staff</option>
                        <option value="User">User</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none group-hover:text-[#862334] transition-colors" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64 md:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="bg-white border border-gray-200 focus:ring-1 focus:ring-[#862334] text-xs tracking-widest font-Inter w-full pl-10 py-2.5 text-black placeholder:text-gray-400 outline-none rounded"
                        placeholder="SEARCH USERS"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {["User", "Role", "Status", "Created", ""].map((h, i) => (
                          <th
                            key={i}
                            className={`px-4 md:px-6 py-4 md:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 font-Geist ${i === 4 ? "text-right" : ""}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm font-[Manrope,sans-serif]">
                            No accounts match your query.
                          </td>
                        </tr>
                      ) : paginatedAccounts.map((acc, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors group">
                          {/* Identity */}
                          <td className="px-4 md:px-6 py-4 md:py-5">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 bg-gray-100`}>
                                <User className="text-gray-400 w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-black truncate font-[Space_Grotesk,sans-serif]">{acc.name}</div>
                                <div className="text-[10px] text-gray-400 font-[Inter,sans-serif] truncate">{acc.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role badge */}
                          <td className="px-4 md:px-6 py-4 md:py-5">
                            <span className={`px-2 md:px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full font-Inter
                              ${acc.role === "Staff"
                                ? "bg-[#862334]/10 text-[#862334]"
                                : "bg-gray-100 text-gray-500"}`}
                            >
                              {acc.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 md:px-6 py-4 md:py-5">
                            <div className={`flex items-center text-[11px] font-semibold font-[Inter,sans-serif] ${acc.active ? "text-green-700" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${acc.active ? "bg-green-700 animate-pulse" : "bg-gray-300"}`} />
                              {acc.active ? "ACTIVE" : "INACTIVE"}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-4 md:px-6 py-4 md:py-5 text-sm text-gray-400 font-[Inter,sans-serif] whitespace-nowrap">
                            {acc.date}
                          </td>

                          {/* Actions */}
                          <td className="px-4 md:px-6 py-4 md:py-5 text-right">
                            <div className="flex items-center justify-end gap-2 md:gap-3 flex-wrap">
                              <button className="text-[8px] font-bold uppercase tracking-widest text-gray-600 hover:text-[#ffb003] transition-colors whitespace-nowrap font-Geist">
                                Deactivate
                              </button>
                              <button
                                className="bg-[#862334] text-white px-3 md:px-4 py-1.5 md:py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb003] transition-all whitespace-nowrap font-Geist rounded-[2px]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Pagination ── */}
              <div className="md:col-span-12 mt-2 mb-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#862334] text-sm">{totalFilteredPAGES > 0 ? page : 0}</span>
                    <span className="text-gray-400 text-sm">/</span>
                    <span className="text-gray-500 text-sm">{totalFilteredPAGES}</span>
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalFilteredPAGES, p + 1))}
                    disabled={page === totalFilteredPAGES || totalFilteredPAGES === 0}
                    className="font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-500 hover:text-[#862334] transition-colors flex items-center gap-1 disabled:opacity-30"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <span className="hidden sm:block font-[Inter,sans-serif] text-xs uppercase tracking-widest text-gray-400">
                  Viewing {paginatedAccounts.length} of {filtered.length} users
                </span>
              </div>

            </div>
          </section>
          </div>
        </main>

      </div>
    </>
  );
}