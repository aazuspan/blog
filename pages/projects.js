import { Heading, Link, VStack, StackItem } from "@chakra-ui/react";
import Layout from "../components/layout";

const PROJECTS = [
  {
    category: "Software",
    projects: [
      {
        name: "wxee",
        description:
          "An Earth Engine-to-xarray interface for processing time series data.",
        url: "https://github.com/aazuspan/wxee",
      },
      {
        name: "eerepr",
        description:
          "Interactive HTML reprs for Earth Engine objects in a Jupyter notebook.",
        url: "https://github.com/aazuspan/eerepr",
      },
      {
        name: "stacmap",
        description:
          "A lightweight Python package for exploring STAC collections on an interactive map.",
        url: "https://github.com/aazuspan/stacmap",
      },
      {
        name: "minee",
        description: "A bundler for deploying performant Earth Engine modules.",
        url: "https://github.com/aazuspan/minee",
      },
      {
        name: "should-test",
        description:
          "An asynchronous unit testing framework for the Earth Engine Code Editor.",
        url: "https://github.com/aazuspan/should-test",
      },
      {
        name: "sankee",
        description:
          "Interactively visualize land cover changes from time series data in Earth Engine.",
        url: "https://github.com/aazuspan/sankee",
      },
      {
        name: "snazzy",
        description:
          "Use any SnazzyMaps basemap in the Earth Engine Code Editor with a couple lines of code.",
        url: "https://github.com/aazuspan/snazzy",
      },
    ],
  },
  {
    category: "Other Things",
    projects: [
      {
        name: "Arise",
        description:
          "A twin-stick shooter game made from scratch in one week for a game jam.",
        url: "https://aazus.itch.io/arise",
      },
    ],
  },
];

export default function Projects() {
  return (
    <Layout title="Projects" description="Personal open-source projects.">
      <Heading size="md">Projects</Heading>
      <VStack spacing={12} align="stretch">
      {PROJECTS.map(({ category, projects }) => (
        <VStack spacing={4} align="stretch">
            <Heading size="sm">{category}</Heading>
            {projects.map((project) => (
              <Project {...project} key={project.url} />
            ))}
          </VStack>
      ))}
      </VStack>
    </Layout>
  );
}

function Project({ name, description, url }) {
  return (
    <StackItem>
      <Link href={url} isExternal>{name}</Link> - {description}
    </StackItem>
  );
}
