import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import "../styles/homepage.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { CollaborationProvider } from '@/contexts/CollaborationContext';
import { Navigation } from '@/components/layout/Navigation';

// Required fonts as per integration guide
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap", // Performance optimization as per guide
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap", // Performance optimization as per guide
});

// SEO metadata as per integration guide
export const metadata: Metadata = {
  title: "Wayra - AI That Books Your Perfect Trip While You Sleep",
  description: "Set your budget, pick your dream destination. Wayra's AI hunts for deals 24/7 and books your flights, hotels, and activities when prices hit your target.",
  keywords: "AI travel planning, automated booking, travel deals, budget travel, smart travel",
  openGraph: {
    title: "Wayra - AI That Books Your Perfect Trip While You Sleep",
    description: "Set your budget, pick your dream destination. Wayra's AI hunts for deals 24/7 and books your flights, hotels, and activities when prices hit your target.",
    type: "website",
    images: ["/images/wayra-og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayra - AI That Books Your Perfect Trip While You Sleep",
    description: "Set your budget, pick your dream destination. Wayra's AI hunts for deals 24/7 and books your flights, hotels, and activities when prices hit your target.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
      >
        <AuthProvider>
          <CollaborationProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="lg:pl-64">
                <div className="lg:pt-0 pt-16">
                  {children}
                </div>
              </main>
            </div>
          </CollaborationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
