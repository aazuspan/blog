import Link from "next/link";
import Date from "./date";
import { Heading, StackItem, Text, Stack, Flex  } from "@chakra-ui/react";

export default function BlogPreview({ id, date, title, summary }) {
  return (
    <StackItem as="article" key={id}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
      >
        <Heading as="h4" pt={0} size="sm">
          <Link href={`/blog/${id}`}>{title}</Link>
        </Heading>
        <Date dateString={date} />
      </Flex>
      <Stack spacing={4} />
      <Text pt={2}>{summary}</Text>
    </StackItem>
  );
}
