import Globe from "./globe";
import NavBar from "./navbar";
import ThemeToggle from "./theme_toggle";

export default function Header() {
  return (
    <header>
      <ThemeToggle />
      <Globe />
      <NavBar />
    </header>
  );
}
