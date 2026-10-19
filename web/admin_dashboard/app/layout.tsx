import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  title: "UniMove Admin",
  description: "UniMove Admin Dashboard",
};

/**
 * Anti-flicker inline script: reads localStorage before first paint and
 * applies the `.dark` class to <html> so the correct theme is shown
 * without any flash of the wrong colour scheme.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('unimove-admin-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark =
      stored === 'dark' ||
      (stored !== 'light' && (stored === 'system' || !stored) && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-flicker: apply dark class before hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
