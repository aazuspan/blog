import "../styles/globals.scss";

import ThemeProvider from "../components/theme";
import Footer from "../components/footer";
import Header from "../components/header";

export default function App({ Component, pageProps }) {
  return (
    <main>
      <ThemeProvider>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </ThemeProvider>
    </main>
  );
}
