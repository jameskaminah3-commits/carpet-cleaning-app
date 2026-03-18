import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/about", label: "About Us" },
    { href: "/faq", label: "FAQs" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Booking Terms" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <img
              src="/Logos.png"
              alt="Sparkle n' Glee"
              className="h-14 sm:h-16 w-auto"
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={`cursor-pointer transition-colors ${
                    isActive ? "text-slate-900 font-semibold" : "hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login">
            <button className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50 transition">
              Sign In
            </button>
          </Link>

          <Link href="/book">
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-[#2E77D0] to-[#3A86E9] shadow-md hover:scale-105 transition-all duration-200">
              <Sparkles className="w-3.5 h-3.5" />
              Free Quote
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
