import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({ node, inline, className, children, ...props }) {
  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }
  
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  return (
    <SyntaxHighlighter
      children={String(children).replace(/\n$/, "")}
      style={vs}
      PreTag="div"
      language={language}
      {...props}
    />
  );
}
