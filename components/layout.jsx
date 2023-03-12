import Head from "next/head";

export default function Layout({ children, title, description }) {
  const pageTitle = title ? title + " - Aaron Zuspan" : "Aaron Zuspan";

  return (
    <main>
      <Head key={title}>
        <meta name="description" content={description} charSet="UTF-8" />
        <title>{pageTitle}</title>
      </Head>
      {children}
    </main>
  );
}
