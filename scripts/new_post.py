import argparse

from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
import slugify


@dataclass
class PostMetadata:
    title: str
    description: str = ""
    tags: list[str] = field(default_factory=list)
    date: datetime = field(default_factory=datetime.now)


class Post:
    def __init__(self, meta: PostMetadata):
        self.meta = meta
        self.slug = slugify.slugify(meta.title)

    def create_post(self, blog_dir: Path) -> Path:
        post_dir = blog_dir / self.slug
        post_dir.mkdir(parents=True, exist_ok=True)
        post_file = post_dir / "index.md"
        if post_file.exists():
            raise FileExistsError(f"Post already exists at {post_file}")
        
        with open(post_file, "w") as f:
            f.write(self.frontmatter)
            f.write("Hello world!\n")

        return post_file

    @property
    def frontmatter(self) -> str:
        tag_str = ", ".join(f'"{tag}"' for tag in self.meta.tags)
        return (
            "+++\n"
            f"title = \"{self.meta.title}\"\n"
            f"date = \"{self.meta.date.isoformat()}\"\n"
            f"description = \"{self.meta.description}\"\n"
            f"tags = [{tag_str}]\n"
            "+++\n\n"
        )
    
    @classmethod
    def from_input(cls):
        title = input("Title: ").strip()
        description = input("Description (or enter): ").strip()
        tags = input("Comma-separated tags (or enter): ").split(",")
        tags = [tag.strip() for tag in tags if tag.strip()]
        return cls(PostMetadata(title, description, tags))
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new blog post.")
    parser.add_argument(
        "--blog-dir",
        type=Path,
        default=Path("content/blog"),
        help="Directory where blog posts are stored.",
    )
    args = parser.parse_args()

    try:
        post = Post.from_input()
    except KeyboardInterrupt:
        print("\nCancelled.")
        exit(1)
    try:
        post_file = post.create_post(args.blog_dir)
        print(f"SUCCESS: Post created at {post_file}")
    except Exception as e:
        print(f"ERROR: {e}")
        exit(1)
