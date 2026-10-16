import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { APP_NAME, TAGLINE, REGION } from "@/lib/constants";
import "./globals.css";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsScriptSrc = googleMapsApiKey
  ? `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=weekly&loading=async`
  : null;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: `${TAGLINE} — Report incidents, protect your community, and respond to emergencies across ${REGION} with SafeSphere Connect. Dial 112 for national emergency.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d6e8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        {googleMapsScriptSrc ? (
          <Script
            id="google-maps-js"
            src={googleMapsScriptSrc}
            strategy="beforeInteractive"
          />
        ) : null}
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
