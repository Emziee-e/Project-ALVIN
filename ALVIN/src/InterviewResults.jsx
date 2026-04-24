import { useState } from "react";
import Logo from './assets/alvin-logo.png';

const Icon = ({ name, filled = false, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    {name}
  </span>
);

const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "mic_external_on", label: "Interviews" },
  { icon: "settings", label: "Settings" },
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
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        html, body, #root { height: 100%; margin: 0; width: 100%; }
      `}</style>

      <div className="flex mx-auto w-screen bg-white text-black font-[Manrope,sans-serif]">

        {/* ── Main ── */}
        <main className="mx-auto flex-1 pb-24">

          {/* Top Header */}
          <header className="fixed top-0 left-0 md:left-0 right-0 z-40 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 py-4 border-b border-[#e5e5e5]">
            <div className="hidden md:flex items-center gap-3 text-sm font-[Inter,sans-serif] opacity-100">
                          <img src={Logo} alt="Alvin logo" className="w-[55px] mb-[-10px]" />
                          <span className="text-[#862334] font-bold pt-2 ">Results & Feedback</span>
                        </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-[#e5e5e5] text-black hover:bg-[#f8f8f8] transition-all font-bold uppercase text-xs tracking-widest font-[Inter,sans-serif]"
              >
                <Icon name="arrow_back" className="text-sm" />
                Go back to dashboard
              </a>
              <button className="bg-transparent border-0 cursor-pointer p-2 text-[#4a4a4a] hover:text-[#862334] transition-colors rounded">
                <Icon name="notifications" />
              </button>
              <div className="w-8 h-8 rounded-full border border-[#e5e5e5] bg-[#862334]/20 flex items-center justify-center text-[#862334] text-xs font-bold font-[Space_Grotesk,sans-serif]">
                VN
              </div>
            </div>
          </header>

          {/* ── Page Content ── */}
          <div className="pt-24 px-6 md:px-12 max-w-[1400px] mx-auto">

            {/* Mobile back */}
            <div className="md:hidden mb-8">
              <a href="#" className="flex items-center gap-2 text-[#862334] font-bold uppercase text-xs tracking-widest font-[Inter,sans-serif]">
                <Icon name="arrow_back" className="text-sm" />
                Dashboard
              </a>
            </div>

            {/* ── Hero: Score ── */}
            <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-7">
                <h2 className="flex justify-start text-[#4b5563] font-[Space_Grotesk,sans-serif] uppercase tracking-widest text-sm mb-4 mx-auto">
                  Session Result //
                </h2>
                <div className="flex justify-start text-[130px] p-5 font-[Space_Grotesk,sans-serif] font-bold leading-none tracking-tighter text-black">
                  84<span className="text-[#862334]">%</span>
                </div>
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <span className="bg-[#862334] text-white px-6 py-1 text-sm font-bold uppercase tracking-widest">
                    Status: Pass
                  </span>
                  <span className="text-[#4b5563] text-sm font-medium font-[Manrope,sans-serif]">
                    Session duration: 42m 12s
                  </span>
                </div>
              </div>
              <div className="lg:col-span-5 flex justify-end gap-4 flex-wrap">
                <button className="px-8 py-4 border border-[#e5e5e5] text-black hover:bg-[#f8f8f8] transition-all font-bold uppercase text-sm tracking-widest font-[Space_Grotesk,sans-serif]">
                  Download PDF
                </button>
                <button className="px-8 py-4 bg-[#862334] text-white hover:bg-[#ffb003] transition-all font-bold uppercase text-sm tracking-widest font-[Space_Grotesk,sans-serif]">
                  New Session
                </button>
              </div>
            </section>

            {/* ── Rubric Breakdown ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {rubrics.map((r) => (
                <div key={r.label} className="bg-white border border-[#e5e5e5] p-8 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[#4b5563] font-[Space_Grotesk,sans-serif] uppercase text-xs tracking-widest mb-2">
                      Rubric {r.number}
                    </p>
                    <h3 className="text-2xl font-[Space_Grotesk,sans-serif] font-bold mb-6">{r.label}</h3>
                    <div className="text-4xl font-[Space_Grotesk,sans-serif] font-bold mb-4 text-[#862334]">
                      {r.score}%
                    </div>
                    <div className="h-1 w-full bg-[#e5e5e5]">
                      <div className="h-full bg-[#862334]" style={{ width: `${r.score}%` }} />
                    </div>
                  </div>
                  <Icon
                    name={r.icon}
                    className="absolute -bottom-4 -right-4 text-[#f8f9fa] text-[80px] opacity-10 group-hover:scale-110 transition-transform"
                  />
                </div>
              ))}
            </section>

            {/* ── Transcript & Feedback + Sidebar ── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">

              {/* Left: Transcript */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <h2 className="text-3xl font-[Space_Grotesk,sans-serif] font-bold uppercase tracking-tight text-black">
                    Transcript<span className="text-[#e5e5e5] ml-4 font-light">&amp;</span> Feedback
                  </h2>
                  <span className="bg-[#f8f9fa] border border-[#e5e5e5] px-4 py-1 text-xs font-[Inter,sans-serif] uppercase text-[#4b5563]">
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

                      <h4 className="text-[#4b5563] font-[Inter,sans-serif] uppercase text-xs tracking-tighter mb-4 italic">
                        Interviewer
                      </h4>
                      <p className="text-xl font-[Space_Grotesk,sans-serif] font-medium mb-8 pb-2">{q.question}</p>

                      {/* Answer */}
                      <div className="bg-[#f8f9fa] p-6 mb-8 border border-[#e5e5e5]">
                        <h4 className="text-[#4b5563] font-[Inter,sans-serif] uppercase text-[10px] tracking-widest mb-4">
                          Your Answer
                        </h4>
                        <p className="text-black/80 leading-relaxed font-medium font-[Manrope,sans-serif]">{q.answer}</p>
                      </div>

                      {/* AI Critique */}
                      <div className="bg-[#862334]/5 p-6 border-l-4 border-[#ffb003]">
                        <div className="flex items-center gap-3 mb-4">
                          <Icon name="smart_toy" filled className="text-[#862334] text-lg" />
                          <h4 className="text-[#862334] font-[Space_Grotesk,sans-serif] font-bold uppercase text-xs tracking-widest">
                            AI Critique
                          </h4>
                        </div>
                        <p className="text-black/90 italic mb-4 font-[Manrope,sans-serif]">{q.critique}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-8">

                {/* Action Items */}
                <div className="bg-[#f8f9fa] border border-[#e5e5e5] p-8">
                  <h3 className="font-[Space_Grotesk,sans-serif] font-bold uppercase text-sm tracking-widest mb-8 text-[#862334]">
                    Tips & Recommendations
                  </h3>
                  <ul className="space-y-6">
                    {actionItems.map((item) => (
                      <li key={item.num} className="flex gap-4">
                        <span className="text-[#862334] font-[Space_Grotesk,sans-serif] font-bold flex-shrink-0">{item.num}</span>
                        <p className="text-sm text-[#4b5563] leading-relaxed font-[Manrope,sans-serif]">{item.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}