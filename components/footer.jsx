import Social from "./social";

export default function Footer() {
  return (
    <footer>
      <Social />
      <small>© {new Date().getFullYear()} Aaron Zuspan</small>
    </footer>
  );
}
