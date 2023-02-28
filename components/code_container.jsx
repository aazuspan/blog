import styles from "../styles/code_container.module.css";

export default function CodeContainer({ className, style, children }) {
  return (
    <div className={styles["code-container"]} style={style}>
      {children}
    </div>
  );
}
