import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Premium modern font
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AlertProvider } from "@/context/alert-context";
import { AuthProvider } from "@/context/auth-context";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Fezinha do Dia",
  description: "Sistema de Apostas",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased font-sans bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <AlertProvider>
            {children}
            <Toaster />
          </AlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
