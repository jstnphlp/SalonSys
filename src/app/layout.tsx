import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";
import { AppToasts } from "@/components/shared/app-toasts";

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full font-sans antialiased", "font-sans")}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <AppToasts>{children}</AppToasts>
      </body>
    </html>
  );
}
