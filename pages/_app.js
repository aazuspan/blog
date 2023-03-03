import "../styles/globals.scss";

import { Outfit as HeaderFont, Quicksand as MainFont } from "@next/font/google";
import Globe from "../components/globe";
import ThemeProvider from "../components/theme";
import ThemeToggle from "../components/theme_toggle";

const headerFont = HeaderFont({
  subsets: ["latin"],
  weight: "700",
  variable: "--header-font",
});

const mainFont = MainFont({
  subsets: ["latin"],
  weight: "400",
  variable: "--main-font",
});

export default function App({ Component, pageProps }) {
  return (
    <main className={`${headerFont.variable} ${mainFont.className}`}>
      <ThemeProvider>
        <ThemeToggle />
        <header>
          <Globe />
        </header>
        <Component {...pageProps} />
      </ThemeProvider>
    </main>
  );
}
