import { StackItem, Link, VStack, Heading } from "@chakra-ui/react";

function Item({ title, description, href }) {
  return (
    <StackItem>
      <Link href={href} isExternal={href.startsWith("http") ? true : false}>
        {title}
      </Link>{" "}
      - {description}
    </StackItem>
  );
}

export default function CategorizedItems({items}) {
  return (
    <VStack pt={3} pb={6} gap={3}>
      {items.map(({ category, items }) => (
        <VStack spacing={4} align="stretch" key={category}>
          <Heading as="h2">{category}</Heading>
          {items.map((item) => (
            <Item {...item} key={item.href} />
          ))}
        </VStack>
      ))}
    </VStack>
  );
}
