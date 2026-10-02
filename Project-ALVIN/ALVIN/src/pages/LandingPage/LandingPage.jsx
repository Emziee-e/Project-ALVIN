import Features from "./Features";
import Header from "./Header";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks"; // Removed { }
import About from "./About";
import Team from "./Team"; // Removed { }
import Footer from "./Footer";

function LandingPage() {
  return (
    <>
      <Header />
      <div data-aos="zoom-in-up" className="relative min-h-screen overflow-x-hidden">
        <main className="overflow-x-hidden">
          <Hero />
          <About />
          <HowItWorks />
          <Features />
          <Team />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default LandingPage;