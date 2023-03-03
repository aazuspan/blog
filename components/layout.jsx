import Head from "next/head";
import NavBar from "./navbar";
import Footer from "./footer";
import Link from "next/link";
import styles from "../styles/layout.module.css";
import Globe from "./globe";

export default function Layout({ children, title, description }) {
  const pageTitle = title ? title + " - Aaron Zuspan" : "Aaron Zuspan";
  return (
    <div className={styles.container}>
      <Head>
        <meta name="description" content={description} charset="UTF-8" />
        console.log("title: " + title)
        <title>{pageTitle}</title>
      </Head>
      <header>
        <Link href="/">
          <h1 className={styles.title}>Aaron Zuspan</h1>
        </Link>
        <NavBar />
      </header>
      <main className={styles.content}>{children}</main>
      <Footer />
    </div>
  );
}

