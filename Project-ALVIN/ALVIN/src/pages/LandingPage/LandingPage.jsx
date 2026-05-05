import { useState } from 'react';
import Features from "./Features";
import Header from "./Header"
import Hero from "./Hero"
import { HowItWorks } from "./HowItWorks";
import { Team } from "./Team";
import Footer from "./Footer";
import RoleSelectionModal from '../../Components/RoleSelectionModal.jsx';
function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Header onOpenModal={openModal} />
      <div data-aos="zoom-in-up" className="relative min-h-screen overflow-x-hidden">
        <main className="overflow-x-hidden">
        <RoleSelectionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        />
        <Hero onOpenModal={openModal} />
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
