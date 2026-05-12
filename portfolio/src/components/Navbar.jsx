import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { useScrollSpy } from "../hooks/useScrollSpy.js";

const navItems = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

const sectionIds = ["hero", ...navItems.map((item) => item.id)];

function Navbar() {
  const activeSection = useScrollSpy(sectionIds);
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleNavClick() {
    setIsOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        hasScrolled ? "border-b border-white/10 bg-[#0a0a0f]/78 shadow-2xl shadow-black/20 backdrop-blur-2xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <a href="#hero" className="group flex items-center gap-3 font-bold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-cyan-300 shadow-lg shadow-cyan-950/20 transition group-hover:border-cyan-300/40">
            OB
          </span>
          <span>Omar Brome</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeSection === item.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-xl text-slate-200 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {isOpen && (
        <div className="mx-4 mb-4 grid gap-2 rounded-3xl border border-white/10 bg-[#111118]/95 p-3 backdrop-blur-2xl md:hidden">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={handleNavClick}
              className={`rounded-2xl px-4 py-3 text-sm transition ${
                activeSection === item.id ? "bg-white/10 text-white" : "text-slate-400"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

export default Navbar;
