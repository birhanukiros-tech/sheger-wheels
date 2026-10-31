
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://sheger-wheels-two.vercel.app"),

  title: {
    default: "Sheggar Wheels | Find Your Next Ride",
    template: "%s | Sheggar Wheels",
  },

  description:
    "Discover and book cars for your next journey with Sheggar Wheels, a demo peer-to-peer car rental marketplace for Addis Ababa, Ethiopia.",

  applicationName: "Sheggar Wheels",

  openGraph: {
    title: "Sheggar Wheels | Find Your Next Ride",
    description:
      "Discover cars available for rent in Addis Ababa with Sheggar Wheels.",
    siteName: "Sheggar Wheels",
    locale: "en_ET",
    type: "website",
    images: [
      {
        url: "/images/hero/hero-car.jpg",
        width: 1200,
        height: 800,
        alt: "Sheggar Wheels car rental marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Sheggar Wheels | Find Your Next Ride",
    description:
      "Discover cars available for rent in Addis Ababa with Sheggar Wheels.",
    images: ["/images/hero/hero-car.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
