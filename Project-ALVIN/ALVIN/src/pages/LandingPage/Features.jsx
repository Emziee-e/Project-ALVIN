import { Brain, MessageSquare, BarChart3, Target, Clock, Shield } from "lucide-react"
import { useInView } from "../../lib/useInView"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Responses",
    description:
      "Our advanced AI analyzes your answers in real-time, providing industry-specific feedback tailored to your target role.",
  },
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description:
      "Experience realistic interview simulations with dynamic follow-up questions that adapt to your responses.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track your progress with detailed analytics, identify improvement areas, and watch your confidence grow.",
  },
  {
    icon: Target,
    title: "Industry-Specific Prep",
    description:
      "Practice with questions curated for your specific industry, from tech to finance to healthcare.",
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description:
      "Make mistakes without consequences. Build confidence in a judgment-free practice space.",
  },
]

export function Features() {
  const [ref, isInView] = useInView();
  return (
    <section id="features" className="py-10 lg:py-20  bg-grid-pattern">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-Geist text-maroon text-4xl font-bold uppercase inline-block">
            Features
          </span>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10" ref={ref}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-10 rounded-[2rem] backdrop-blur-l border border-maroon/30 transition-all duration-700 ${isInView ? 'animate-fade-in-up' : 'animate-fade-out-down'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon Container with the muted maroon/rose background */}
              <div className="w-12 h-12 rounded-xl bg-[#F8E7E7] flex items-center justify-center mb-8">
                <feature.icon className="h-6 w-6 text-[#8B2332]" strokeWidth={1.5} />
              </div>

              <h3 className="font-Geist text-[22px] font-bold text-maroon mb-4 tracking-tight">
                {feature.title}
              </h3>

              <p className="font-Inter text-[#4B5563] text-[15px] leading-[1.6] font-medium opacity-90">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features;