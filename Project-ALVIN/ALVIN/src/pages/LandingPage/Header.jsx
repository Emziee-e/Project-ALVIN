import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/');
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: targetId } });
    } else {
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLinks = [
    { name: "About", id: "about" },
    { name: "How It Works", id: "how-it-works" },
    { name: "Features", id: "features" },
    { name: "Team", id: "team" },
  ];

  return (
    <header className="fixed top-0 left-0 z-50 w-full px-4 sm:px-8 py-4 transition-all duration-300">
      {/* Floating Pill Container */}
      <nav
        className={`max-w-7xl mx-auto rounded-2xl px-6 py-3 transition-all duration-300 flex items-center justify-between border ${
          isScrolled
            ? 'bg-white/70 backdrop-blur-md border-gray-200/80 shadow-md shadow-gray-900/5'
            : 'bg-transparent border-transparent'
        }`}
      >
        {/* Left: Logo Section */}
        <a
          href="#hero"
          onClick={handleLogoClick}
          className="inline-flex items-center gap-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src="/images/Alvin-logo.png" alt="ALVIN logo" className="h-10 w-auto object-contain" />
          <span className="ml-[-2px] font-Geist text-[32px] font-bold text-[#862334] tracking-tighter leading-none">
            LVIN
          </span>
        </a>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="font-Geist text-sm text-gray-700 hover:text-[#862334] font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right: Action Buttons */}
        <div className="hidden md:flex items-center space-x-5">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-[#862334] text-white text-sm px-5 py-2.5 rounded-full font-bold hover:bg-[#a12d41] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span>Get Started</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-700 hover:text-[#862334] transition-colors p-1"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown */}
      <div
        className={`md:hidden max-w-7xl mx-auto mt-2 rounded-2xl bg-white/95 backdrop-blur-lg border border-gray-200/90 shadow-xl transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100 p-6' : 'max-h-0 opacity-0 p-0 border-none'
        }`}
      >
        <div className="flex flex-col items-center space-y-5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className="font-Geist text-base text-gray-700 hover:text-[#862334] font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}

          <div className="w-full pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                navigate('/login/student');
                setIsMobileMenuOpen(false);
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#862334] text-white px-6 py-3 rounded-full font-bold hover:bg-[#a12d41] transition-colors shadow-sm cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;