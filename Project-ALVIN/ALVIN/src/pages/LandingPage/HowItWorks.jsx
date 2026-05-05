import { useInView } from "../../lib/useInView";

const steps = [
  {
    step: "01",
    title: "Upload Your Resume",
    description:
      "Our AI analyzes your background and skills to generate personalized interview questions tailored specifically to your experience.",
  },
  {
    step: "02",
    title: "Practice with AI",
    description:
      "Engage in realistic interview simulations. ALVIN asks questions, listens to your responses, and adapts in real-time.",
  },
  {
    step: "03",
    title: "Get Instant Feedback",
    description:
      "Receive detailed analysis on your answers, communication style, and areas for improvement immediately after each session.",
  },
  {
    step: "04",
    title: "Track & Improve",
    description:
      "Monitor your progress over time. See how you're improving and focus on areas that need more attention.",
  },
]

export function HowItWorks() {
  const [ref, isInView] = useInView();
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-card bg-grid-pattern">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="font-Geist text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6 text-balance text-maroon">
            Your Path to Interview Success
          </h2>
          <p className="font-Inter text-lg text-muted-foreground text-pretty">
            Getting started with ALVIN is simple. Follow these four steps
            and start acing your interviews.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8" ref={ref}>
          {steps.map((item, index) => (
            <div key={index} className={`relative transition-all duration-700 ${isInView ? 'animate-slide-in-left' : 'animate-slide-out-right'}`}
              style={{ animationDelay: `${index * 100}ms` }}>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[15%] w-full h-0.5 bg-ub-yellow" />
              )}

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-maroon flex items-center justify-center mb-6">
                  <span className="text-lg font-bold text-primary-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-Geist text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="font-Inter text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
