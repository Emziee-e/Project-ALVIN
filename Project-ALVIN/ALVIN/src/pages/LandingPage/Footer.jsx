function Footer() {
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();

    // Scroll smoothly back to the top when clicking the logo
    if (targetId === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", window.location.pathname);
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  return (
    <footer className="bg-[#FDFBF7] border-t border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Left Side: Logo & Name (Smoothly scrolls back to top) */}
          <a
            href="#"
            onClick={(e) => handleSmoothScroll(e, "top")}
            className="flex items-center group cursor-pointer transition-transform duration-300 active:scale-95"
          >
            <div className="w-auto h-8 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/images/Alvin-logo.png"
                alt="ALVIN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-Geist text-2xl font-bold text-maroon tracking-tighter leading-none">
              LVIN
            </span>
          </a>

          {/* Right Side: Links with Smooth Scroll & Underline Micro-Animation */}
          <div className="flex gap-x-8">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "features")}
              className="relative py-1 text-[10px] font-bold text-gray-400 hover:text-maroon transition-all duration-300 active:scale-95 tracking-widest uppercase group"
            >
              <span>Features</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-maroon transition-all duration-300 ease-out group-hover:w-full" />
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, "how-it-works")}
              className="relative py-1 text-[10px] font-bold text-gray-400 hover:text-maroon transition-all duration-300 active:scale-95 tracking-widest uppercase group"
            >
              <span>Guide</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-maroon transition-all duration-300 ease-out group-hover:w-full" />
            </a>

            <a
              href="mailto:admin.alvin01.com"
              className="relative py-1 text-[10px] font-bold text-gray-400 hover:text-maroon transition-all duration-300 active:scale-95 tracking-widest uppercase group"
            >
              <span>Contact</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-maroon transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          </div>
        </div>

        {/* Bottom Section: Mission & Copyright */}
        <div className="mt-6 flex flex-col items-center text-center">
          <p className="text-[13px] text-maroon font-Geist mb-2">
            ALVIN: An AI-Powered Learning and Vision-Based Interview Navigation System for Career Readiness
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Team Katana. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;