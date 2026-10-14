import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";
import ToastProvider from "@/components/common/ToastProvider";

export const metadata: Metadata = {
  title: "ChainIt Dashboard",
  description: "Task and project management for ChainIt",
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <TaskProvider>
              {children}
            </TaskProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
