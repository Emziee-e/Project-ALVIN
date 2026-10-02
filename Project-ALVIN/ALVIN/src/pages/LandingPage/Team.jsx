import { useInView } from "../../lib/useInView";

const teamMembers = [
  {
    name: "John Manuel Policarpio III",
    role: "Project Manager & Quality Assurance",
    image: "./public/images/Poli.jpg"
  },
  {
    name: "John Ashley Alday",
    role: "Frontend Developer & UI/UX Designer",
    image: "./public/images/Ashley.jpg"
  },
  {
    name: "Vin Vernon Perez",
    role: "Backend Developer & AI Specialist",
    image: "./public/images/Vin.png"
  }
];

export function Team() {
  const [ref, isInView] = useInView();

  return (
    <section id="team" className="py-20 lg:py-28 bg-[#F5F0E6] text-[#111827] border-t border-[#EAE5D9] relative overflow-hidden">

      {/* Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 pointer-events-none rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(134, 35, 52, 0.06) 0%, transparent 70%)"
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14 lg:mb-20">

          {/* Geist Mono Header Label */}
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#862334] font-semibold mb-3">
            <span>04</span>
            <span className="w-8 h-px bg-[#862334]/40" />
            <span>THE TEAM BEHIND ALVIN</span>
          </div>

          <h2 className="font-Geist text-4xl sm:text-5xl lg:text-6xl font-black text-[#111827] tracking-tight leading-none">
            TEAM <span className="text-[#862334]">KATANA</span>
          </h2>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto" ref={ref}>
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={`group relative flex flex-col transition-all duration-700 ${
                isInView ? 'animate-scale-rotate-in' : 'animate-scale-rotate-out'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Frame */}
              <div className="relative mb-6">
                {/* Snug Outer Dashed Accent Border */}
                <div className="absolute -inset-2.5 border-2 border-dashed border-[#862334]/20 rounded-3xl transition-all duration-500 group-hover:scale-[0.98] group-hover:border-[#862334]/60 group-hover:rotate-1 pointer-events-none" />

                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white border border-[#EAE5D9] shadow-sm transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(134,35,52,0.12)] group-hover:-translate-y-1.5">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover scale-100 grayscale-[0.15] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-in-out"
                  />
                </div>
              </div>

              {/* Centered Member Details */}
              <div className="text-center relative z-20 px-2">
                <h3 className="text-xl lg:text-2xl font-Geist font-bold text-[#111827] tracking-tight leading-snug transition-colors duration-300 group-hover:text-[#862334]">
                  {member.name}
                </h3>

                <p className="text-[11px] font-mono font-semibold text-[#862334] uppercase tracking-wider mt-1.5 leading-relaxed">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Team;