import type { Metadata } from "next";
import "./globals.css";

const themeScript = `(function(){try{var s=localStorage.getItem('unimove-provider-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&(s==='system'||!s)&&d)){document.documentElement.classList.add('dark');}}catch(_){}})()`;

export const metadata: Metadata = {
  title: "UniMove Provider - Nhà vận chuyển",
  description: "Quản lý đơn hàng và thu nhập UniMove",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full" style={{ backgroundColor: "var(--bg)" }}>
        {children}
      </body>
    </html>
  );
}
