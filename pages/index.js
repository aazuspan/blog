import Layout from "../components/layout";
import Link from "next/link";
import { Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Layout
      title="About"
      description="Home page for Aaron Zuspan's personal site."
    >
      <Text textAlign="justify">
        I'm a research fellow at the U.S. Forest Service Pacific Northwest
        Research Station where I use remote sensing and machine learning to{" "}
        <Link href="/research/">study</Link> post-fire forests. On the weekends,
        I'm frequently writing <Link href="/projects/">open-source code</Link>{" "}
        or <Link href="/blog">rambling</Link> about cloud-native geospatial
        tech.
      </Text>
    </Layout>
  );
}
