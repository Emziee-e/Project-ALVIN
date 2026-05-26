import Features from "./Features";
import Header from "./Header"
import Hero from "./Hero"
import { HowItWorks } from "./HowItWorks";
import { Team } from "./Team";
import Footer from "./Footer";

function LandingPage() {
  return (
    <>
      <Header />
      <div data-aos="zoom-in-up" className="relative min-h-screen overflow-x-hidden">
        <main className="overflow-x-hidden">
        <Hero />
        <Features />
        <HowItWorks />
        <Team />
      </main>
      <Footer />
    </div>
    </>
  );
}

export default LandingPage;