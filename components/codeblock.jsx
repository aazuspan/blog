import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  ghcolors as lightStyle,
  xonokai as darkStyle,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "../styles/codeblock.module.scss";
import { useColorModeValue } from "@chakra-ui/react";

import CodeContainer from "./code_container";

export default function CodeBlock({ node, inline, className, children }) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const content = String(children).replace(/\n$/, "").trim();
  const style = useColorModeValue(lightStyle, darkStyle);

  if (inline) {
    return <code className={styles.inline}>{content}</code>;
  }
  if (language === "text") {
    return <code className={styles.output}>{content}</code>;
  }

  return (
    <SyntaxHighlighter
      style={style}
      language={language}
      showLineNumbers={false}
      PreTag={CodeContainer}
      lang={language}
      content={content}
    >
      {content}
    </SyntaxHighlighter>
  );
}
