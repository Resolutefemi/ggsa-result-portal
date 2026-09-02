import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://godgenerals.vercel.app"),
  title: "God Generals Standard Academy — Result Portal",
  description: "Student result checking and teacher result management portal for God Generals Standard Academy, Ikare-Akoko. Built by Resolute Femi (Ariyo Oluwafemi Stephen).",
  keywords: ["God Generals Standard Academy", "GGSA", "result", "school portal", "Ikare-Akoko", "student result checker", "Resolute Femi", "Ariyo Oluwafemi Stephen", "Built by Resolute Femi"],
  authors: [{ name: "Resolute Femi", url: "https://github.com/Resolutefemi" }],
  creator: "Resolute Femi (Ariyo Oluwafemi Stephen)",
  publisher: "God Generals Standard Academy — Built by Resolute Femi",
  openGraph: {
    type: "website",
    siteName: "GGSA Result Portal",
    locale: "en_NG",
    title: "God Generals Standard Academy — Result Portal",
    description: "Student result checking and management portal for God Generals Standard Academy, Ikare-Akoko. Built by Resolute Femi (Ariyo Oluwafemi Stephen).",
  },
  twitter: {
    card: "summary",
    title: "GGSA Result Portal — Built by Resolute Femi",
    description: "God Generals Standard Academy result portal. Built by Resolute Femi (Ariyo Oluwafemi Stephen).",
    creator: "@Resolutefemi",
  },
  icons: {
    icon: "/logo-transparent.png",
  },
};

const ggsaJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://github.com/Resolutefemi#person",
      name: "Resolute Femi",
      alternateName: ["Ariyo Oluwafemi Stephen", "Ariyo Oluwafemi", "Resolutefemi"],
      email: "mailto:ariyooluwafemi487@gmail.com",
      jobTitle: "Software Engineer & Founder of Renance",
      url: "https://github.com/Resolutefemi",
      description:
        "Resolute Femi (Ariyo Oluwafemi Stephen) is a Nigerian software engineer and founder of Renance — developer of the God Generals Standard Academy result portal.",
    },
    {
      "@type": "WebApplication",
      "@id": "https://godgenerals.vercel.app#app",
      name: "GGSA Result Portal",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: "https://godgenerals.vercel.app",
      description:
        "Student result checking and teacher result management portal for God Generals Standard Academy, Ikare-Akoko. Built by Resolute Femi (Ariyo Oluwafemi Stephen).",
      author: { "@id": "https://github.com/Resolutefemi#person" },
      creator: { "@id": "https://github.com/Resolutefemi#person" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ggsaJsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
