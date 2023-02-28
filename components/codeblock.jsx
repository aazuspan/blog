import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs as lightStyle, xonokai as darkStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ThemeContext } from "./theme";
import { useContext} from "react";

import CodeContainer from "./code_container";

export default function CodeBlock({ node, inline, className, children, }) {
  const { theme } = useContext(ThemeContext);  

  if (inline) {
    return <code className={className}>{children}</code>;
  }

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  return (
    <SyntaxHighlighter
      children={String(children).replace(/\n$/, "")}
      style={theme === "dark" ? darkStyle : lightStyle}
      language={language}
      showLineNumbers={true}
      PreTag={CodeContainer}
    />
  );
}
