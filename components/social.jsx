import Link from "next/link";
import { FaTwitter, FaGithub, FaMastodon, FaLinkedin, FaRss } from "react-icons/fa";
import styles from "../styles/social.module.scss";

export default function Social() {
  return (
    <span className={styles["social-container"]}>
      <a href="https://twitter.com/aazuspan" className={styles["social-link"]}>
        <FaTwitter className={styles["social-button"]} />
      </a>
      <a href="https://github.com/aazuspan" className={styles["social-link"]}>
        <FaGithub className={styles["social-button"]} />
      </a>
      <a href="https://fosstodon.org/@aazuspan" className={styles["social-link"]}>
        <FaMastodon className={styles["social-button"]} />
      </a>
      <a href="https://www.linkedin.com/in/aaron-zuspan-91b5261b4" className={styles["social-link"]}>
        <FaLinkedin className={styles["social-button"]} />
      </a>
      <Link href="/rss.xml" rel="alternate" type="application/rss+xml" title="RSS Feed" className={styles["social-link"]}>
        <FaRss className={styles["social-button"]} />
      </Link>
    </span>
  );
}
