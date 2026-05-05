import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patchbay",
  description: "A systems puzzle game about building calm judgment into noisy environments."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
