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
]

export function Team() {
  const [ref, isInView] = useInView();
  return (
    <section id="about" className="py-16 lg:py-20 bg-white bg-grid-pattern">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-15">
          <div className="text-m font-medium text-primary uppercase tracking-wider">
            the team behind ALVIN
          </div>
          <h2 className="text-4xl md:text-5xl font-Geist font-extrabold mt-4 text-foreground ">
            TEAM <span className="text-maroon">KATANA</span>
          </h2>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24 max-w-6xl mx-auto" ref={ref}>
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={`group relative flex flex-col transition-all duration-700 ${isInView ? 'animate-scale-rotate-in' : 'animate-scale-rotate-out'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Modern Minimalist Image Frame */}
              <div className="relative mb-10">
                {/* Decorative border that slides on hover */}
                <div className="absolute -inset-4 border-2 border-dashed border-gray-100 rounded-3xl transition-all duration-500 group-hover:scale-95 group-hover:border-maroon/60 group-hover:rotate-3 pointer-events-none"></div>

                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-50 border border-gray-200 transition-all duration-700 group-hover:shadow-[0_20px_50px_rgba(134,35,52,0.15)] group-hover:-translate-y-3">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover scale-100 grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-in-out"
                  />
                </div>
              </div>

              {/*Centered Info */}
              <div className="text-center relative z-20">
                <h3 className="text-2xl font-Geist font-black text-gray-900 tracking-tight transition-all duration-300 group-hover:text-maroon">
                  {member.name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    {member.role}
                  </p>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Team;
