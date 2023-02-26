import ReactMarkdown from "react-markdown";
import path from "path";
import matter from "gray-matter";
import fs from "fs";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import Date from "../../components/date";
import Layout from "../../components/layout";
import CodeBlock from "../../components/codeblock";
import styles from "../../styles/blog_post.module.css";

export async function getStaticPaths() {
  const paths = fs
    .readdirSync("posts")
    .map((fileName) => ({ params: { id: fileName.replace(/\.md$/, "") } }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { id } }) {
  const raw = fs
    .readFileSync(path.join("posts", id + ".md"), "utf8")
    .toString();

  const parsed = matter(raw);

  return {
    props: {
      markdown: parsed.content,
      metadata: parsed.data,
    },
  };
}

export default function Post({ markdown, metadata }) {
  const astPlugins = [
    [remarkMath, { inlineMath: [["$", "$"]], displayMath: [["$$", "$$"]] }],
  ];

  return (
    <Layout title={metadata.title} description={metadata.summary}>
      <h1 className={styles.title}>{metadata.title}</h1>
      <article>
        <small>
          <Date dateString={metadata.date} />
        </small>
        <ReactMarkdown
          children={markdown}
          skipHtml={false}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{ code: CodeBlock }}
        />
      </article>
    </Layout>
  );
}
