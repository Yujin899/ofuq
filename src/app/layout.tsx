import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({ 
  subsets: ["arabic"], 
  weight: ["400", "500", "600", "700"], 
  variable: "--font-arabic" 
});


export const metadata: Metadata = {
  title: "Ofuq",
  description: "Your e-learning workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ibmPlexSansArabic.variable} font-sans antialiased text-foreground bg-background`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>

  );
}
