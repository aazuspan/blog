import Social from "./social";

export default function Footer() {
  return (
    <footer>
      <Social />
      <br/>
      <small>© {new Date().getFullYear()} Aaron Zuspan</small>
    </footer>
  );
}
