import Layout from "../components/layout";
import styles from "../styles/research.module.css";

export default function Research() {
  return (
    <Layout title="Research" description="Published research projects, publications, posters, and talks.">
      <h2>Research</h2>
      <h3>Publications</h3>
      <ul className={styles.researchList}>
        <li key="cascadia-burning">
          <a href="https://esajournals.onlinelibrary.wiley.com/doi/full/10.1002/ecs2.4070">
            Cascadia Burning: The Historic, but not Historically Unprecedented,
            2020 Wildfires in the Pacific Northwest, USA.
          </a> Ecosphere, 2022.
        </li>

        <h3>Posters and Talks</h3>
        <li key="ashes-to-logs">
          <b>
            From Ashes to Logs: Long-term Monitoring of Post-fire Harvests in
            the Western United States.
          </b> Poster presented at the Oregon Post-fire Symposium, February 2023.
        </li>
      </ul>
    </Layout>
  );
}

