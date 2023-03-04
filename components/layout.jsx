import Head from "next/head";
import styles from "../styles/layout.module.css";

export default function Layout({ children, title, description }) {
  const pageTitle = title ? title + " - Aaron Zuspan" : "Aaron Zuspan";
  return (
    <div className={styles.container}>
      <Head>
        <meta name="description" content={description} charSet="UTF-8" />
        <title>{pageTitle}</title>
      </Head>
      <main>{children}</main>
    </div>
  );
}

