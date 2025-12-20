import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edge Notes AI Spark",
  description: "A minimalist, AI-powered digital garden.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <div 
          className="fixed left-0 top-0 h-full w-full z-[-1] pointer-events-none"
          style={{
            backgroundImage: 'url("/1d3ef831abebdc0030e6c9828371729e.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
            maskImage: 'linear-gradient(to right, black 0%, transparent 80%), linear-gradient(to bottom, black 0%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 80%)', 
          }}
        />
        {children}
      </body>
    </html>
  );
}
