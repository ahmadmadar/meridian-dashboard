import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meridian Dashboard",
  description: "Read-only operations view over Meridian's account, ticket, and incident data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
            <span className="font-semibold">Meridian</span>
            <a href="/renewal-risk" className="text-sm text-foreground/70 hover:text-foreground">
              Renewal Risk
            </a>
            <Link href="/incidents" className="text-sm text-foreground/70 hover:text-foreground">
              Incidents
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
