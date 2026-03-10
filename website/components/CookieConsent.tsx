import { useState, useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowConsent(true);
    } else if (consent === "granted") {
      updateConsent(true);
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
      });
    }
  };

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "granted");
    setShowConsent(false);
    updateConsent(true);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "denied");
    setShowConsent(false);
    updateConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 p-4 md:p-6 z-[100] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-300 max-w-4xl">
        <p>
          <strong>We value your privacy.</strong> We use Google Analytics and Vercel Analytics to measure website traffic and performance. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
        </p>
      </div>
      <div className="flex gap-4 shrink-0">
        <button
          onClick={declineCookies}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-lg"
        >
          Decline
        </button>
        <button
          onClick={acceptCookies}
          className="px-6 py-2 text-sm font-bold bg-accent text-black rounded-lg hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
