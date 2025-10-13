import type { Metadata } from "next";
import { Inter, Merriweather, Dancing_Script } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  variable: '--font-merriweather'
});
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: '--font-dancing-script'
});

export const metadata: Metadata = {
  title: "Driving School Dashboard",
  description: "Professional dashboard for driving school management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Cloudinary Upload Widget Script */}
        <script
          src="https://upload-widget.cloudinary.com/global/all.js"
          async
        />
      </head>
      <body className={`${inter.className} ${merriweather.variable} ${dancingScript.variable}`}>
        <NotificationProvider>
          <Providers>
            {children}
          </Providers>
        </NotificationProvider>
      </body>
    </html>
  );
} 