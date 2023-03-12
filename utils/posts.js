import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function getPostPaths() {
  const paths = fs
    .readdirSync("posts")
    .filter((filename) => filename.endsWith(".md"));

  return paths;
}

export function getParsedPost(id) {
  const raw = fs
    .readFileSync(path.join("posts", id + ".md"), "utf8")
    .toString();

  return matter(raw);
}

export function getSortedPosts() {
  const paths = getPostPaths();
  const posts = paths
    .map((filename) => {
      const id = filename.replace(/\.md$/, "");
      const raw = fs
        .readFileSync(path.join("posts", id + ".md"), "utf8")
        .toString();

      const parsed = matter(raw);
      const date = parsed.data.date;
      const title = parsed.data.title;
      const summary = parsed.data.summary;
      let thumbnail = parsed.data.thumbnail;
      thumbnail = thumbnail ? thumbnail : "/images/clouds.jpeg";

      return { id, date, title, summary, thumbnail };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return posts;
}
