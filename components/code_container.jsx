import styles from "../styles/code_container.module.scss";
import { FaCopy, FaCheck } from "react-icons/fa";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useState } from "react";

export default function CodeContainer({
  className,
  style,
  children,
  lang,
  content,
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={styles["code-block"]} style={style}>
      <div className={styles["header"]}>
        <span>{lang}</span>
        <CopyToClipboard
          text={content}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 2000);
          }}
        >
          <button className={styles["copy-button"]}>
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </CopyToClipboard>
      </div>
      <div className={styles["code-container"]}>{children}</div>
    </div>
  );
}
