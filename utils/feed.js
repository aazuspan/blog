import fs from "fs";
import { Feed } from "feed";

export async function generateRssFeed(posts) {
  const url = "https://aazuspan.dev";

  const config = {
    title: "Blog - Aaron Zuspan",
    description: "Blog posts on geospatial tech.",
    id: url,
    link: url,
    favicon: `${url}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Aaron Zuspan`,
    feedLinks: {
      rss2: `${url}/rss.xml`,
      json: `${url}/rss.json`,
      atom: `${url}/atom.xml`,
    },
  };

  const feed = new Feed(config);

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${url}/blog/${post.id}`,
      link: `${url}/blog/${post.id}`,
      description: post.summary,
      date: new Date(post.date),
    });
  });

  fs.writeFileSync("./public/rss.xml", feed.rss2());
  fs.writeFileSync("./public/rss.json", feed.json1());
  fs.writeFileSync("./public/atom.xml", feed.atom1());
}
