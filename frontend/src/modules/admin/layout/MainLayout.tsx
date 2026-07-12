import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, Bell, Download } from "lucide-react";

export function MainLayout() {
  const location = useLocation();
  const isPlaybackPage = location.pathname.endsWith("/playback");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Inject Admin Manifest dynamically
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest-admin.json";
    link.id = "admin-manifest";
    document.head.appendChild(link);

    // Inject iOS specific tags for Add to Home Screen
    const appleIcon = document.createElement("link");
    appleIcon.rel = "apple-touch-icon";
    appleIcon.href = "/favicon/icon.png";
    appleIcon.id = "admin-apple-icon";
    document.head.appendChild(appleIcon);

    const appleTitle = document.createElement("meta");
    appleTitle.name = "apple-mobile-web-app-title";
    appleTitle.content = "204PROD.ADMIN";
    appleTitle.id = "admin-apple-title";
    document.head.appendChild(appleTitle);

    // 2. Register Admin Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw-admin.js", { scope: "/admin/" })
        .then(function (registration) {
          console.log("Admin Service Worker registered with scope:", registration.scope);
        })
        .catch(function (error) {
          console.error("Admin Service Worker registration failed:", error);
        });
    }

    // Cleanup when leaving admin section
    return () => {
      const existingLink = document.getElementById("admin-manifest");
      if (existingLink) document.head.removeChild(existingLink);

      const existingAppleIcon = document.getElementById("admin-apple-icon");
      if (existingAppleIcon) document.head.removeChild(existingAppleIcon);

      const existingAppleTitle = document.getElementById("admin-apple-title");
      if (existingAppleTitle) document.head.removeChild(existingAppleTitle);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[#0A0707]">
      {!isPlaybackPage && (
        <>
          {/* Ambient Glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D84040]/5 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[#8E1616]/4 rounded-full blur-[150px] pointer-events-none z-0" />
        </>
      )}
      {!isPlaybackPage && (
        <>
          {/* Backdrop for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            installPrompt={installPrompt}
            onInstallClick={handleInstallClick}
          />
        </>
      )}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen z-10 transition-all duration-300 ${!isPlaybackPage ? "lg:ml-64" : ""}`}>
        {/* Mobile Header Bar */}
        {!isPlaybackPage && (
          <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#141010] border-b border-[#2A1F1F] sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <img src="/favicon/204-logo.png" alt="204 Logo" className="h-10 w-10 object-contain" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="p-2 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors"
              >
                <Bell size={20} />
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-[#2A1F1F] text-white hover:bg-[#3A2A2A] transition-colors"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
