import { Outlet, NavLink } from "react-router";
import { Zap } from "lucide-react";

export function ClientLayout() {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-black flex flex-col overscroll-none no-scrollbar">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="w-full px-12 md:px-24 !py-6 grid grid-cols-5 items-center">
          <div className="flex justify-start">
            <NavLink to="/works" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Featured Work [6]
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/works" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Portfolio [25]
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/">
              <img
                src="/favicon/android-chrome-512x512.png"
                alt="Logo"
                className="h-24 w-auto object-contain"
              />
            </NavLink>
          </div>

          <div className="flex justify-center">
            <NavLink to="/about" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              About
            </NavLink>
          </div>

          <div className="flex justify-end">
            <NavLink to="/contact" className="text-[15px] font-light tracking-wide hover:text-white/70 transition-colors text-white">
              Contact
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="w-full px-12 md:px-24 py-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center text-[13px] font-light text-white/50 w-full">
          <p>
            © {new Date().getFullYear()} Major All rights reserved.
          </p>

          <div className="flex items-center gap-12 mt-4 md:mt-0">
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Services</a>
              <a href="#" className="hover:text-white transition-colors">Site by Stökt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
