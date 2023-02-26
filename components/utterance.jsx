import { useEffect, useRef } from 'react';

// https://paulie.dev/posts/2022/08/how-to-use-utterances-with-react/
export default function Utterance() { 
  const containerRef = useRef();

  useEffect(() => {
    const utterances = document.createElement('script');

    const config = {
      src: 'https://utteranc.es/client.js',
      repo: 'aazuspan/blog',
      'issue-term': 'pathname',
      label: '💬 utterance',
      theme: 'github-light',
      crossOrigin: 'anonymous',
      defer: true,
    };

    Object.entries(config).forEach(([key, value]) => {
      utterances.setAttribute(key, value);
    });

    setTimeout(() => {
        containerRef.current.appendChild(utterances);
    }, 300);
  }, []);

  return <div ref={containerRef} />;
}