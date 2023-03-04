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
    <>
      <Link href="/">
        <h1
          className={`${styles.title} ${
            router.pathname === "/" ? styles.active : ""
          }`}
        >
          Aaron Zuspan
        </h1>
      </Link>
      <nav className={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const active = router.pathname.includes(item.href);

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
    </>
  );
}
