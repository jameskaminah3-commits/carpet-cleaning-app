import { Link } from "wouter";

export default function Navbar() {
  return (
<header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">      
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="Logos.png" className="h-10 w-auto" />
            <span className="font-semibold text-lg">
          
            </span>
          </div>
        </Link>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
<Link href="/book">
  <button className="flex items-center gap-2 px-6 py-2.5 rounded-full 
  text-white font-medium
  bg-gradient-to-r from-blue-500 to-blue-600
  hover:from-blue-600 hover:to-blue-700
  shadow-lg hover:shadow-xl
  transition-all duration-300">

    ✨ Free Quote
  </button>
</Link>

         <Link href="/login">
  <button className="px-5 py-2.5 rounded-full 
  border border-border 
  bg-white 
  text-sm font-medium
  hover:bg-muted
  transition">
    Sign In
  </button>
</Link>

        </div>

      </div>
    </header>
  );
}