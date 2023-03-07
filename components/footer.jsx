import {
  FaTwitter,
  FaGithub,
  FaMastodon,
  FaLinkedin,
  FaRss,
} from "react-icons/fa";
import { Link, HStack, VStack } from "@chakra-ui/react";

function SocialLink({ href, icon, ...props }) {
  return (
    <Link href={href} {...props}>
      {icon}
    </Link>
  );
}

export default function Footer() {
  return (
    <VStack as="footer">
      <HStack spacing={4}>
        <SocialLink
          href="https://twitter.com/aazuspan"
          icon={<FaTwitter size={24}/>}
          isExternal
        />
        <SocialLink
          href="https://github.com/aazuspan"
          icon={<FaGithub size={24}/>}
          isExternal
        />
        <SocialLink
          href="https://fosstodon.org/@aazuspan"
          icon={<FaMastodon size={24}/>}
          isExternal
        />
        <SocialLink
          href="https://www.linkedin.com/in/aaron-zuspan-91b5261b4"
          icon={<FaLinkedin size={24}/>}
          isExternal
        />
        <SocialLink
          href="/rss.xml"
          icon={<FaRss />}
          rel="alternate"
          type="application/rss+xml"
        />
      </HStack>
      <small>© {new Date().getFullYear()} Aaron Zuspan</small>
    </VStack>
  );
}
