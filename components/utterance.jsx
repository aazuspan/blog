import { useEffect, useRef, useContext } from "react";
import { ThemeContext } from "./theme";

// https://paulie.dev/posts/2022/08/how-to-use-utterances-with-react/
export default function Utterance() {
  const containerRef = useRef();
  const { theme } = useContext(ThemeContext);
  const config = {
    src: "https://utteranc.es/client.js",
    repo: "aazuspan/blog",
    "issue-term": "pathname",
    label: "💬 utterance",
    theme: `github-${theme}`,
    crossOrigin: "anonymous",
    defer: true,
  };

  useEffect(() => {
    const utterances = document.createElement("script");

    Object.entries(config).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });

    // Timeout needed for stability
    setTimeout(() => {
      containerRef.current.appendChild(utterances);
    }, 150);
    // Prevent duplicating the comment box
    containerRef.current.innerHTML = "";
  }, [theme]);

  return <div ref={containerRef} />;
}
