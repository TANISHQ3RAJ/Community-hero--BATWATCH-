import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Community Hero",
  description: "Hyperlocal civic issue reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${anton.variable} ${ibmPlexMono.variable} ${inter.variable} antialiased min-h-screen flex flex-col font-body-md text-body-md`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
