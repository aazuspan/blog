import { FaTwitter, FaGithub, FaMastodon, FaLinkedin } from "react-icons/fa";
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
    </span>
  );
}
