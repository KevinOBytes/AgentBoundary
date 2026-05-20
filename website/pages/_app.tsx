import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import GoogleAnalytics from "../components/GoogleAnalytics";
import CookieConsent from "../components/CookieConsent";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const vercelAnalyticsEnabled =
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  return (
    <>
      <Head>
        <link rel="icon" href="/kevinbytes-logo.png" />
        <link rel="apple-touch-icon" href="/kevinbytes-logo.png" />
      </Head>
      <GoogleAnalytics GA_MEASUREMENT_ID="G-P78P9N87QB" />
      <Component {...pageProps} />
      <CookieConsent />
      {vercelAnalyticsEnabled && <Analytics />}
    </>
  );
}
