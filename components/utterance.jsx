import { useEffect, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";

// https://paulie.dev/posts/2022/08/how-to-use-utterances-with-react/
export default function Utterance() {
  const containerRef = useRef();
  const { colorMode } = useColorMode();

  useEffect(() => {
    const config = {
      src: "https://utteranc.es/client.js",
      repo: "aazuspan/blog",
      "issue-term": "pathname",
      label: "💬 utterance",
      theme: `github-${colorMode}`,
      crossOrigin: "anonymous",
      defer: true,
    };

    const utterances = document.createElement("script");

    Object.entries(config).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });

    // Timeout needed for stability
    setTimeout(() => {
      containerRef.current.appendChild(utterances);
    }, 300);
    // Prevent duplicating the comment box
    containerRef.current.innerHTML = "";
  }, [colorMode]);

  return <div ref={containerRef} />;
}
