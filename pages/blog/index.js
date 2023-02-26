import fs from "fs";
import path from "path";
import matter from "gray-matter";
import BlogPreview from "../../components/blog_preview";
import Layout from "../../components/layout";
import styles from "../../styles/blog_index.module.css"

/**
 * Load all blog post metadata to display on the home page.
 */
export async function getStaticProps() {
  const posts = fs
    .readdirSync("posts")
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      const raw = fs
        .readFileSync(path.join("posts", id + ".md"), "utf8")
        .toString();

      const parsed = matter(raw);
      const date = parsed.data.date;
      const title = parsed.data.title;
      const summary = parsed.data.summary;

      return { id, date, title, summary };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return { props: { posts } };
}

export default function Blog({ posts }) {
  return (
    <>
      <Layout title="Blog" description="Blog posts.">
        <h2>Blog</h2>
        <ul className={styles.postList}>
          {posts.map(({ id, date, title, summary }) =>
            BlogPreview({ id, date, title, summary })
          )}
        </ul>
      </Layout>
    </>
  );
}
