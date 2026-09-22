import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "ConstructIQ — AI Construction Resource Optimization Platform",
  description: "AI-powered material forecasting, cross-project surplus redistribution, and procurement intelligence for construction operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090D16] text-zinc-100 min-h-screen flex antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pl-64 transition-all">
          <Header />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
