import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "About", href: "#about" },
  ];

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 px-6 py-4 ${
      isScrolled
        ? 'bg-white/80 backdrop-blur-md shadow-sm'
        : 'bg-transparent bg-grid-pattern'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Left: Logo Section */}
        <a href="#hero" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* Simple recreation of the icon in your image */}
          <div className="flex items-center justify-center w-13 h-13 ">
            <img src="/images/Alvin-logo.png" alt="alvin logo" />
          </div>
          <span className=" font-Geist text-3xl font-GeistSans text-maroon">
            ALVIN
          </span>
        </a>

        {/* Center: Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className=" font-Geist text-black-500 hover:text-gray-900 font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right: Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => navigate('/login/student')}
            className="bg-[#962838] text-white px-6 py-2.5 rounded-full font-bold hover:bg-ub-yellow transition-shadow shadow-sm"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-maroon transition-colors"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation (Dropdown) */}
      <div className={`md:hidden absolute left-0 w-full bg-white border-b border-gray-100 shadow-lg transition-all duration-300 overflow-hidden ${
        isMobileMenuOpen ? 'max-h-96 opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
      }`}>
        <div className="flex flex-col items-center space-y-6 px-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-Geist text-lg text-black-500 hover:text-maroon font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={() => {
              navigate('/login/student');
              setIsMobileMenuOpen(false);
            }}
            className="w-full bg-[#962838] text-white px-6 py-3 rounded-full font-bold hover:bg-[#7d212e] transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Header;