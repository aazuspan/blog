import BlogPreview from "../../components/blog_preview";
import Layout from "../../components/layout";
import { getSortedPosts } from "../../utils/posts";
import { generateRssFeed } from "../../utils/feed";
import { Heading, StackDivider, VStack } from "@chakra-ui/react";

export async function getStaticProps() {
  const posts = getSortedPosts();
  generateRssFeed(posts);

  return { props: { posts } };
}

export default function Blog({ posts }) {
  return (
    <>
      <Layout title="Blog" description="Blog posts.">
        <Heading as="h1">Blog</Heading>
        <VStack pt={3} spacing={4} align="stretch" divider={<StackDivider />}>
          {posts.map(({ id, date, title, summary }) =>
            BlogPreview({ id, date, title, summary })
          )}
        </VStack>
      </Layout>
    </>
  );
}
