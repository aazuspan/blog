import Link from "next/link";
import Date from "./date";
import styles from "../styles/blog_preview.module.css";

export default function BlogPreview({ id, date, title, summary }) {
  return (
    <li key={id} className={styles.container}>
      <Link href={`/blog/${id}`}>
        <h3 className={styles.title}>{title}</h3>
      </Link>
      <small>
        <Date dateString={date} />
      </small>
      <p>{summary}</p>
    </li>
  );
}
