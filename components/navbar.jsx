import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  VStack,
  HStack,
  Link,
  Heading,
  StackDivider,
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
    <VStack>
      <Link href="/" as={NextLink}>
        <Heading size="xl" pt={3} fontWeight="bold" textDecoration={home ? "dotted underline" : "none"}>
          Aaron Zuspan
        </Heading>
      </Link>
      <nav>
        <HStack gap={2} divider={<StackDivider borderColor="gray.500" />}>
          {NAV_ITEMS.map((item) => {
            const active = router.pathname.includes(item.href);
            return (
              <Link
                as={NextLink}
                href={item.href}
                key={item.href}
              >
                <Heading size="sm" fontWeight="regular" textDecoration={active ? "dotted underline" : "none"} >
                  {item.text}
                </Heading>
              </Link>
            );
          })}
        </HStack>
      </nav>
    </VStack>
  );
}
