import { useState} from "react";
import { LayoutDashboard, Mic, Settings, Bot} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '/images/Alvin-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Mic, label: "Interview History" },
  { icon: Settings, label: "Settings" },
];

const rubrics = [
  { label: "Behavior", number: "01", score: 85, icon: "code" },
  { label: "Communication",    number: "02", score: 70, icon: "forum" },
  { label: "Confidence",       number: "03", score: 90, icon: "bolt" },
];

const actionItems = [
  { num: "01", text: <>Avoid filler words like “um” or “uh” to <strong className="text-black">improve clarity</strong>.</> },
  { num: "02", text: <>Maintain <strong className="text-black">steady eye contact</strong> and a <strong className="text-black">confident posture</strong>.</> },
  { num: "03", text: <>Practice keeping your answers under <strong className="text-black">2 minutes</strong> to maintain engagement.</> },
  { num: "04", text: <>Use <strong className="text-black">specific examples and metrics</strong> to support your points.</> },
];

const questions = [
  {
    question: '"Can you briefly introduce yourself and walk me through your background?"',
    answer: '"I’m a full-stack developer with a strong focus on backend systems and scalable architectures. I recently worked at DataCore Solutions, where I contributed to building APIs that handled high-volume requests. I’ve worked with technologies like Node.js, PostgreSQL, and Docker, and I’m particularly interested in designing efficient systems that can scale reliably."',
    critique: '"Your introduction is clear and well-structured, and you highlighted relevant technologies effectively. However, it would be stronger if you included a specific achievement or measurable impact to make your profile more memorable."',
    highlight: true,
  },
  {
    question: '"Tell me about yourself and what makes you a good fit for this role."',
    answer: '"I’m a software engineer with experience in building web applications and working in agile teams. In my previous role at DevLink, I worked on improving frontend performance and collaborated closely with backend engineers to optimize API usage. I enjoy solving performance-related problems and continuously improving user experience."',
    critique: '"You demonstrated strong alignment with the role and emphasized collaboration well. To improve, consider tailoring your answer more specifically to the company and including a concrete example of impact, such as performance improvements or user metrics."',
    highlight: false,
  },
];

const mobileNav = [
  { icon: "assessment", label: "Report" },
  { icon: "donut_small", label: "Breakdown", active: true },
  { icon: "forum", label: "Transcript" },
  { icon: "tune", label: "Settings" },
];

export default function InterviewResults() {
  const [activeNav, setActiveNav] = useState(1);

  return (
    <>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

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
            <ul className="flex flex-col gap-1 list-none">
              {navItems.map((item, i) => {
                const isDashboard = i === 0;
                const isInterviews = i === 1;
                const isSettings = i === 2;
                const navLink = isDashboard ? '/user/dashboard' : isInterviews ? '/user/interviews' : isSettings ? '/user/settings' : '#';

                return (
                  <li key={item.label}
                    className={`${activeNav === i ? "border-r-4 border-[#862334] bg-[#f0f0f0]" : ""}`}
                  >
                    {isDashboard || isInterviews || isSettings ? (
                      <Link
                        to={navLink}
                        onClick={(e) => { setActiveNav(i); }}
                        className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                          ${activeNav === i
                            ? "text-[#862334]"
                            : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <a
                        href="#"
                        onClick={e => { e.preventDefault(); setActiveNav(i); }}
                        className={`flex items-center gap-4 px-4 py-3 no-underline transition-all duration-200 font-Geist uppercase tracking-[0.15em] text-xs rounded-[2px]
                          ${activeNav === i
                            ? "text-[#862334]"
                            : "text-[#4a4a4a] hover:text-[#862334] hover:bg-[#f0f0f0]"}`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto">
            <button className="w-full bg-[#862334] hover:bg-[#ffb003] text-white border-0 cursor-pointer font-Geist font-bold uppercase tracking-[0.1em] text-xs rounded-[2px] flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200">
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 w-full md:ml-60 lg:ml-64 bg-white overflow-hidden flex flex-col h-screen">

          {/* Top Header */}
          <header className="sticky top-0 left-0 right-0 md:left-60 lg:left-64 z-40 bg-white/85 backdrop-blur-md flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-3">
            </div>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-shrink-0">
              <button className="hidden sm:flex bg-transparent border-0 cursor-pointer p-2 text-[#4a4a4a] hover:text-[#862334] transition-colors rounded">
              </button>
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-[#e5e5e5] flex-shrink-0">
                <div className="w-full h-full bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                  VN
                </div>
              </div>
            </div>
          </header>

          {/* ── Page Content ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 w-full bg-white">
            <div className="max-w-[1400px] mx-auto">

            {/* ── Hero: Score ── */}
            <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-7">
                <h2 className="flex justify-start text-[#4b5563] font-Geist uppercase tracking-widest text-sm mb-4 mx-auto">
                  Session Result //
                </h2>
                <div className="flex justify-start text-[130px] p-5 font-Geist font-bold leading-none tracking-tighter text-black">
                  84<span className="text-[#862334]">%</span>
                </div>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <span className="bg-[#862334] text-white px-6 py-1 text-sm font-bold uppercase tracking-widest">
                    Status: Pass
                  </span>
                  <span className="text-[#4b5563] text-sm font-medium font-Inter">
                    Session duration: 42m 12s
                  </span>
                </div>
              </div>
              <div className="lg:col-span-5 flex justify-end gap-4 flex-wrap">
                <button className="px-8 py-4 border border-[#e5e5e5] text-black hover:bg-[#f8f8f8] transition-all font-bold uppercase text-sm tracking-widest font- Geist">
                  Download PDF
                </button>
                <button className="px-8 py-4 bg-[#862334] text-white hover:bg-[#ffb003] transition-all font-bold uppercase text-sm tracking-widest font- Geist">
                  New Session
                </button>
              </div>
            </section>

            {/* ── Rubric Breakdown ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {rubrics.map((r) => (
                <div key={r.label} className="bg-white border border-[#e5e5e5] p-8 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[#4b5563] font-Inter uppercase text-xs tracking-widest mb-2">
                      Rubric {r.number}
                    </p>
                    <h3 className="text-2xl font-Geist font-bold mb-6">{r.label}</h3>
                    <div className="text-4xl font-Geist font-bold mb-4 text-[#862334]">
                      {r.score}%
                    </div>
                    <div className="h-1 w-full bg-[#e5e5e5]">
                      <div className="h-full bg-[#862334]" style={{ width: `${r.score}%` }} />
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[#f8f9fa] text-[80px] opacity-10 group-hover:scale-110 transition-transform">
                    ★
                  </div>
                </div>
              ))}
            </section>

            {/* ── Transcript & Feedback + Sidebar ── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* Left: Transcript */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <h2 className="text-3xl font-Geist font-bold uppercase tracking-tight text-black">
                    Transcript<span className="text-[#e5e5e5] ml-4 font-light">&amp;</span> Feedback
                  </h2>
                  <span className="bg-white border border-maroon px-4 py-1 text-xs font-Inter uppercase text-[#4b5563] rounded-full">
                    2 Questions Total
                  </span>
                </div>

                <div className="space-y-12">
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      className={`border-l-4 pl-8 py-2 relative ${q.highlight ? "border-[#862334]" : "border-[#e5e5e5]"}`}
                    >
                      {/* Diamond marker */}
                      <div className={`absolute -left-[10px] top-4 w-4 h-4 rotate-45 ${q.highlight ? "bg-[#862334]" : "bg-[#e5e5e5]"}`} />

                      <h4 className="text-[#4b5563] font-Inter uppercase text-xs tracking-tighter mb-4 italic">
                        Interviewer
                      </h4>
                      <p className="text-xl font-Inter font-medium mb-8 pb-2">{q.question}</p>

                      {/* Answer */}
                      <div className="bg-[#f8f9fa] p-6 mb-8 border border-[#e5e5e5]">
                        <h4 className="text-[#4b5563] font-Inter uppercase text-[10px] tracking-widest mb-4">
                          Your Answer
                        </h4>
                        <p className="text-black/80 leading-relaxed font-medium font-Inter text-justify">{q.answer}</p>
                      </div>

                      {/* AI Critique */}
                      <div className="bg-[#862334]/5 p-6 border-l-4 border-[#ffb003]">
                        <div className="flex items-center gap-3 mb-4">
                          <Bot className="text-[#862334]" size={20} />
                          <h4 className="text-[#862334] font-Inter font-bold uppercase text-xs tracking-widest">
                            AI Critique
                          </h4>
                        </div>
                        <p className="text-black/90 italic mb-4 font-Inter text-justify">{q.critique}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-8">

                {/* Action Items */}
                <div className="bg-[#f8f9fa] border border-[#e5e5e5] p-8">
                  <h3 className="font-Geist font-bold uppercase text-sm tracking-widest mb-8 text-[#862334]">
                    Tips & Recommendations
                  </h3>
                  <ul className="space-y-6">
                    {actionItems.map((item) => (
                      <li key={item.num} className="flex gap-4">
                        <span className="text-[#862334] font-Geist font-bold flex-shrink-0">{item.num}</span>
                        <p className="text-sm text-[#4b5563] leading-relaxed font-Inter">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            </div>
          </div>
        </main>

        {/* Decorative glow */}
        <div className="fixed top-0 right-0 w-[60vw] h-[614px] pointer-events-none -z-10 opacity-10"
          style={{ background: "radial-gradient(ellipse at top right, rgba(134,35,52,0.15) 0%, transparent 70%)" }}
        />
      </div>
    </>
  );
}