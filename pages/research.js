import Link from "next/link";
import Layout from "../components/layout";
import { Heading, StackItem, VStack } from "@chakra-ui/react";

export default function Research() {
  return (
    <Layout
      title="Research"
      description="Published research projects, publications, posters, and talks."
    >
      <Heading size="md">Research</Heading>
      <VStack pt={3} pb={6} gap={3}>
        <StackItem>
          <Heading size="sm">Publications</Heading>
          <a href="https://esajournals.onlinelibrary.wiley.com/doi/full/10.1002/ecs2.4070">
            Cascadia Burning: The Historic, but not Historically Unprecedented,
            2020 Wildfires in the Pacific Northwest, USA.
          </a>{" "}
          Ecosphere, 2022.
        </StackItem>

        <StackItem>
          <Heading size="sm">Posters and Talks</Heading>
          <Link href="publications/oregon_postfire_2023_poster.pdf">
            From Ashes to Logs: Long-term Monitoring of Post-fire Harvests in
            the Western United States.
          </Link>{" "}
          Poster presented at the Oregon Post-fire Symposium, February 2023.
        </StackItem>
      </VStack>
    </Layout>
  );
}
