import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "../components/GoogleAnalytics";
import CookieConsent from "../components/CookieConsent";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GoogleAnalytics GA_MEASUREMENT_ID="G-P78P9N87QB" />
      <Component {...pageProps} />
      <CookieConsent />
      <Analytics />
    </>
  );
}
