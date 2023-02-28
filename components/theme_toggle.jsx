import { useContext, useEffect } from "react";
import { ThemeContext } from "./theme";
import styles from "../styles/theme_toggle.module.css";

const changeTheme = (theme) => {
  // Set the dark of light class on the body
  document.body.classList.remove(theme === "dark" ? "light" : "dark");
  document.body.classList.add(theme);
};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  // TODO: Set a default theme, load from local storage, browser default, etc
  useEffect(() => {
    changeTheme(theme);
  }, [theme]);

  return (
    <button
      className={styles["theme-toggle"]}
      title={`${theme === "dark" ? "Light" : "Dark"} mode`}
      onClick={() => {
        toggleTheme();
        changeTheme(theme);
      }
    }>
      {theme === "dark" ? "🌒" : "🌕"}
    </button>
  );
}
