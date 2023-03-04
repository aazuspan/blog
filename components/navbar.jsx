import Link from "next/link";
import styles from "../styles/navbar.module.css";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { text: "Blog", href: "/blog" },
  { text: "Projects", href: "/projects" },
  { text: "Research", href: "/research" },
];

export default function NavBar() {
  const router = useRouter();

  return (
    <nav>
      {NAV_ITEMS.map((item) => {
        const active = item.href === router.pathname;
        return (
          <Link
            href={item.href}
            className={`${styles.item} ${active ? styles.active : ""}`}
            key={item.href}
          >
            {item.text}
          </Link>
        );
      })}
    </nav>
  );
}
