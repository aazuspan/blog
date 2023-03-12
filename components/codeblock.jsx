import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  ghcolors as lightStyle,
  oneDark as darkStyle,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Button,
  Flex,
  useColorModeValue,
  Text,
  HStack,
  StackItem,
  Box,
  Code,
} from "@chakra-ui/react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useState } from "react";

function CodeBlockHeader({ content, language }) {
  const [copied, setCopied] = useState(false);

  return (
    <Flex
      fontSize="sm"
      alignItems="center"
      bg={useColorModeValue("gray.200", "gray.700")}
      borderTopRadius="lg"
    >
      <Text px={4}>{language}</Text>
      <CopyToClipboard
        text={content}
        onCopy={() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        }}
      >
        <Button
          variant="ghost"
          ml="auto"
          _hover={{ backgroundColor: "transparent" }}
        >
          <HStack spacing={2} fontSize="sm" fontWeight="400">
            <StackItem>{copied ? <FaCheck /> : <FaCopy />}</StackItem>
            <StackItem>{copied ? "Copied!" : "Copy"}</StackItem>
          </HStack>
        </Button>
      </CopyToClipboard>
    </Flex>
  );
}

function CodeBlockContainer({ className, style, children, lang, content }) {
  return (
    <Box
      p={0}
      mb={3}
      borderRadius="lg"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      borderWidth="1px"
      transition="all 0.5s !important"
    >
      <CodeBlockHeader content={content} language={lang} />
      <Box overflowX="scroll">
        <Code p={3}>{children}</Code>
      </Box>
    </Box>
  );
}

export default function CodeBlock({ node, inline, className, children }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const content = String(children).replace(/\n$/, "").trim();
  const style = useColorModeValue(lightStyle, darkStyle);

  if (inline) {
    return <Code>{content}</Code>;
  }
  if (language === "text") {
    return (
      <Code overflow="auto" pl={3}>
        {content}
      </Code>
    );
  }

  return (
    <SyntaxHighlighter
      style={style}
      language={language}
      showLineNumbers={false}
      PreTag={CodeBlockContainer}
      lang={language}
      content={content}
    >
      {content}
    </SyntaxHighlighter>
  );
}
