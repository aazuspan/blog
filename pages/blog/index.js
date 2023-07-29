import BlogPreview from "../../components/blog_preview";
import Layout from "../../components/layout";
import TagContainer from "../../components/tag_container";
import { getSortedPosts } from "../../utils/posts";
import { generateRssFeed } from "../../utils/feed";
import {
  Heading,
  VStack,
  Collapse,
  Divider,
} from "@chakra-ui/react";
import { useState } from "react";

export async function getStaticProps() {
  const posts = getSortedPosts();
  generateRssFeed(posts);

  return { props: { posts } };
}

function shouldShowPost(tags, activeTags) {
  return (
    activeTags.length === 0 ||
    tags.filter((tag) => activeTags.includes(tag)).length === activeTags.length
  );
}

export default function Blog({ posts }) {
  const postTags = posts.map((post) => post.tags).flat();
  const uniqueTags = [...new Set(postTags)].sort();
  const [activeTags, setActiveTags] = useState([]);

  return (
    <>
      <Layout title="Blog" description="Blog posts.">
        <Heading as="h1">Blog</Heading>
        <TagContainer
          tags={uniqueTags}
          activeTags={activeTags}
          setActiveTags={setActiveTags}
        />
        <VStack pt={3} spacing={4} align="stretch">
          {      posts.map(({ id, date, title, summary, tags }) => {
        return (
          <Collapse key={id} in={shouldShowPost(tags, activeTags)}>
            <Divider mb={4} />
            <BlogPreview id={id} date={date} title={title} summary={summary} />
          </Collapse>
        );
      })}
        </VStack>
      </Layout>
    </>
  );
}
