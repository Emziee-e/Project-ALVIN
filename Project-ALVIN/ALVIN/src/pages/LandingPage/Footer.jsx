function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Left Side: Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <img src="/images/Alvin-logo.png" alt="ALVIN Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-Geist text-xl font-black text-maroon tracking-tighter">
              ALVIN
            </span>
          </div>

          {/* Right Side: Links */}
          <div className="flex gap-x-8">
            <a href="#features" className="text-[10px] font-bold text-gray-400 hover:text-maroon transition-colors tracking-widest uppercase">
              Features
            </a>
            <a href="#how-it-works" className="text-[10px] font-bold text-gray-400 hover:text-maroon transition-colors tracking-widest uppercase">
              Guide
            </a>
            <a href="mailto:admin.alvin01.com" className="text-[10px] font-bold text-gray-400 hover:text-maroon transition-colors tracking-widest uppercase">
              Contact
            </a>
          </div>
        </div>

        {/* Bottom Section: Mission & Copyright */}
        <div className="mt-6 flex flex-col items-center text-center">
          <p className="text-[13px] text-maroon font-Geist mb-2 ">
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
