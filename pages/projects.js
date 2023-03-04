import Layout from "../components/layout";
import styles from "../styles/projects.module.css";

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
    ],
  },
  {
    category: "Other Things",
    projects: [
      {
        name: "Arise",
        description: "A twin-stick shooter game made from scratch in one week for a game jam.",
        url: "https://aazus.itch.io/arise",
      },
    ],
  },
];

export default function Projects() {
  return (
    <Layout title="Projects" description="Personal open-source projects.">
      <h2>Projects</h2>
      {PROJECTS.map(({ category, projects }) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul className={styles.projectList}>
            {projects.map((project) => (
              <Project {...project} key={project.url} />
            ))}
          </ul>
        </div>
      ))}
    </Layout>
  );
}


function Project({name, description, url}) {
  return (
    <li>
      <a href={url}>{name}</a> - {description}
    </li>
  )
}