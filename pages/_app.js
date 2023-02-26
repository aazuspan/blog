import "../styles/globals.scss";

import { Outfit as HeaderFont, Quicksand as MainFont} from "@next/font/google";
import Globe from "../components/globe";

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
      <Globe/>
      <Component {...pageProps} />
    </main>
  );
}
