import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <NotificationProvider>
          <Providers>
            {children}
          </Providers>
        </NotificationProvider>
      </body>
    </html>
  );
} 