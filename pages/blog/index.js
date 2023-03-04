import BlogPreview from "../../components/blog_preview";
import Layout from "../../components/layout";
import styles from "../../styles/blog_index.module.css";
import { getSortedPosts } from "../../utils/posts";
import { generateRssFeed } from "../../utils/feed";

export async function getStaticProps() {
  const posts = getSortedPosts();
  generateRssFeed(posts);

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
