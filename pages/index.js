import Layout from "../components/layout";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Layout
        title="About"
        description="Home page for Aaron Zuspan's personal site."
      >
        <p>
          I'm a research fellow at the USFS PNW Research Station using remote
          sensing to <Link href="/research/">study</Link> post-fire forests. On
          the weekends, I'm frequently writing{" "}
          <Link href="/projects/">open-source code</Link> or{" "}
          <Link href="/blog">rambling</Link> about cloud-native geospatial tech.
        </p>
      </Layout>
    </>
  );
}
