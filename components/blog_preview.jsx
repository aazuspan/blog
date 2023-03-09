import Link from "next/link";
import Date from "./date";
import { Heading, StackItem, Text, Stack, Flex, Image, HStack } from "@chakra-ui/react";

export default function BlogPreview({ id, date, title, summary }) {
  return (
    <StackItem as="article">
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
      >
        <Heading size="sm">
          <Link href={`/blog/${id}`}>{title}</Link>
        </Heading>
        <Date dateString={date} />
      </Flex>
      <Stack spacing={4} />

      <Text>{summary}</Text>
    </StackItem>
  );
}
