import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata = {
  title: "Bhakti Chitra | दिव्य हिंदू भगवान वॉलपेपर और भक्ति चित्र स्टोर",
  description: "जय श्री राम! डाउनलोड करें उच्च-गुणवत्ता वाले हिंदू देवी-देवता वॉलपेपर, प्रोफाइल डीपी (Bhagwan DP) और कलाकृतियां। Buy premium Hindu God and Goddess digital wallpaper packs, profile DPs, and HD devotional images.",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#FF7700",
  appleWebAppCapable: "yes",
  appleWebAppStatusBarStyle: "default",
  appleWebAppTitle: "Bhakti Chitra",
  applicationName: "Bhakti Chitra",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bhakti Chitra" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
