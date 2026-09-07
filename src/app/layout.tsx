import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trio — Jogo da velha",
  description: "Uma pausa, um amigo e uma boa partida. Jogue jogo da velha com o trio.",
};
const preferencesScript = `(function(){try{var t=localStorage.getItem('trio-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';var l=localStorage.getItem('trio-locale');if(['pt-BR','en-US','es'].includes(l))document.documentElement.lang=l;}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
