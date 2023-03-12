import { Heading } from "@chakra-ui/react";
import Layout from "../components/layout";
import CategorizedItems from "../components/categorized_items";

const PROJECTS = [
  {
    category: "Software",
    items: [
      {
        title: "wxee",
        description:
          "An Earth Engine-to-xarray interface for processing time series data.",
        href: "https://github.com/aazuspan/wxee",
      },
      {
        title: "eerepr",
        description:
          "Interactive HTML reprs for Earth Engine objects in a Jupyter notebook.",
        href: "https://github.com/aazuspan/eerepr",
      },
      {
        title: "stacmap",
        description:
          "A lightweight Python package for exploring STAC collections on an interactive map.",
        href: "https://github.com/aazuspan/stacmap",
      },
      {
        title: "minee",
        description: "A bundler for deploying performant Earth Engine modules.",
        href: "https://github.com/aazuspan/minee",
      },
      {
        title: "should-test",
        description:
          "An asynchronous unit testing framework for the Earth Engine Code Editor.",
        href: "https://github.com/aazuspan/should-test",
      },
      {
        title: "sankee",
        description:
          "Interactively visualize land cover changes from time series data in Earth Engine.",
        href: "https://github.com/aazuspan/sankee",
      },
      {
        title: "snazzy",
        description:
          "Use any SnazzyMaps basemap in the Earth Engine Code Editor with a couple lines of code.",
        href: "https://github.com/aazuspan/snazzy",
      },
    ],
  },
  {
    category: "Other Things",
    items: [
      {
        title: "Arise",
        description:
          "A twin-stick shooter game made from scratch in one week for a game jam.",
        href: "https://aazus.itch.io/arise",
      },
    ],
  },
];

export default function Projects() {
  return (
    <Layout title="Projects" description="Personal open-source projects.">
      <Heading as="h1">Projects</Heading>
      <CategorizedItems items={PROJECTS} />
    </Layout>
  );
}
