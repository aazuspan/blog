import Layout from "../components/layout";
import { Heading } from "@chakra-ui/react";
import CategorizedItems from "../components/categorized_items";

const RESEARCH = [
  {
    category: "Publications",
    items: [
      {
        title:
          "Characterizing post-fire delayed tree mortality with remote sensing: Sizing up the elephant in the room",
        href: "https://link.springer.com/article/10.1186/s42408-023-00223-1",
        description: "Fire Ecology, 2023.",
      },
      {
        title:
          "Cascadia Burning: The Historic, but not Historically Unprecedented, 2020 Wildfires in the Pacific Northwest, USA",
        href: "https://esajournals.onlinelibrary.wiley.com/doi/full/10.1002/ecs2.4070",
        description: "Ecosphere, 2022.",
      },
    ],
  },
  {
    category: "Posters and Talks",
    items: [
      {
        title:
          "From Ashes to Logs: Long-term Monitoring of Post-fire Harvests in the Western United States",
        href: "publications/oregon_postfire_2023_poster.pdf",
        description:
          "Poster presented at the Oregon Post-fire Symposium, February 2023.",
      },
    ],
  },
];

export default function Research() {
  return (
    <Layout
      title="Research"
      description="Published research projects, publications, posters, and talks."
    >
      <Heading as="h1">Research</Heading>
      <CategorizedItems items={RESEARCH} />
    </Layout>
  );
}
