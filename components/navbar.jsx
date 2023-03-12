import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  VStack,
  HStack,
  Link,
  Text,
  StackDivider,
  useColorModeValue,
} from "@chakra-ui/react";

const NAV_ITEMS = [
  { text: "Blog", href: "/blog" },
  { text: "Projects", href: "/projects" },
  { text: "Research", href: "/research" },
];

export default function NavBar() {
  const router = useRouter();
  const home = router.pathname === "/";

  return (
    <VStack as="nav">
      <Link href="/" as={NextLink}>
        <Text
          fontSize="4xl"
          fontWeight={800}
          fontFamily="Outfit, sans-serif"
          textDecoration={home ? "dotted underline" : "none"}
        >
          Aaron Zuspan
        </Text>
      </Link>
      <HStack
        gap={2}
        m="0 !important"
        divider={
          <StackDivider
            borderColor={useColorModeValue("gray.300", "gray.600")}
            transition="all 0.5s !important"
          />
        }
      >
        {NAV_ITEMS.map((item) => {
          const active = router.pathname.includes(item.href);
          return (
            <Link as={NextLink} href={item.href} key={item.href}>
              <Text
                fontSize="xl"
                fontFamily="Outfit, sans-serif"
                textDecoration={active ? "dotted underline" : "none"}
              >
                {item.text}
              </Text>
            </Link>
          );
        })}
      </HStack>
    </VStack>
  );
}
