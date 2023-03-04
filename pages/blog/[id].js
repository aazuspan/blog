import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import Date from "../../components/date";
import Layout from "../../components/layout";
import CodeBlock from "../../components/codeblock";
import Utterance from "../../components/utterance";
import styles from "../../styles/blog_post.module.css";
import { getPostPaths, getParsedPost } from "../../utils/posts";

export async function getStaticPaths() {
  const paths = getPostPaths().map((filename) => ({
    params: { id: filename.replace(/\.md$/, "") },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { id } }) {
  const parsed = getParsedPost(id);

  return {
    props: {
      markdown: parsed.content,
      metadata: parsed.data,
    },
  };
}

export default function Post({ markdown, metadata }) {
  return (
    <Layout title={metadata.title} description={metadata.summary}>
      <article>
        <h1 className={styles.title}>{metadata.title}</h1>
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
      <br />
      <hr />
      <Utterance />
    </Layout>
  );
}
