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
import BackToTopButton from "../../components/back_to_top_button";
import { getPostPaths, getParsedPost } from "../../utils/posts";
import { Heading, Text } from "@chakra-ui/react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

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
        <Heading as="h1">{metadata.title}</Heading>
        <small>
          <Date dateString={metadata.date} />
        </small>
        <ReactMarkdown
          skipHtml={false}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            code: CodeBlock,
            img: ({ src, alt }) => (
              <Zoom>
                <img src={src} alt={alt} />
              </Zoom>
            ),
            p: ({ children }) => <Text my={18}>{children}</Text>,
            h1: ({ children }) => <Heading as="h1">{children}</Heading>,
            h2: ({ children }) => <Heading as="h2">{children}</Heading>,
            h3: ({ children }) => <Heading as="h3">{children}</Heading>,
            h4: ({ children }) => <Heading as="h4">{children}</Heading>,
            h5: ({ children }) => <Heading as="h5">{children}</Heading>,
            h6: ({ children }) => <Heading as="h6">{children}</Heading>,
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
      <br />
      <hr />
      <BackToTopButton />
      <Utterance />
    </Layout>
  );
}
