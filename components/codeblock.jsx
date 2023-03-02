import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs as lightStyle,
  xonokai as darkStyle,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { ThemeContext } from "./theme";
import { useContext } from "react";
import styles from "../styles/codeblock.module.scss";

import CodeContainer from "./code_container";

export default function CodeBlock({ node, inline, className, children }) {
  const { theme } = useContext(ThemeContext);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const content = String(children).replace(/\n$/, "").trim();

  if (inline) {
    return <code className={styles.inline}>{content}</code>;
  }
  if (language === "text") {
    return <code className={styles.output}>{content}</code>;
  }

  return (
    <SyntaxHighlighter
      children={content}
      style={theme === "dark" ? darkStyle : lightStyle}
      language={language}
      showLineNumbers={false}
      PreTag={CodeContainer}
      lang={language}
      content={content}
    />
  );
}
