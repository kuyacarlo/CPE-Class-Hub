import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import InstallPrompt from "@/components/InstallPrompt";
import Toast from "@/components/Toast";
import "@/styles/tokens.css";

// Fonts live in the repo (Latin, variable weight; licenses in app/fonts), so builds never depend on Google Fonts.
const head = localFont({ src: "./fonts/bricolage-grotesque-latin.woff2", weight: "700 800", variable: "--font-head" });
const body = localFont({ src: "./fonts/figtree-latin.woff2", weight: "400 700", variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://cpe-class-hub.vercel.app"), // full image links in link previews
  title: "Class Hub",
  description: "CPE 3C’s schedule, notices, files and courses in one place.",
  appleWebApp: { capable: true, title: "Class Hub" }, // opens full screen from the iPhone home screen
};
const VIEW_SCRIPT = `try{document.documentElement.dataset.view=localStorage.getItem("classhub.calendarView")==="week"?"week":"day"}catch(e){}`;

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        {/* Phones' Schedule view (day summary or Week), set before paint so the page never swaps after loading */}
        <script dangerouslySetInnerHTML={{ __html: VIEW_SCRIPT }} />
        <Header />
        {children}
        <Footer />
        <Toast />
        <InstallPrompt />
      </body>
    </html>
  );
}
