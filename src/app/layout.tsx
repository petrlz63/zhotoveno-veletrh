import type { Metadata } from "next";
import { Geist } from "next/font/google";

import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Zhotoveno pro firmy | Připomenutí",
  description: "Nechte si poslat připomenutí služby Zhotoveno pro firmy.",
  robots: { index: false, follow: false },
  icons: { icon: "/zhotoveno-logo-vektor.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="cs" className={geist.variable}><body>{children}</body></html>;
}
