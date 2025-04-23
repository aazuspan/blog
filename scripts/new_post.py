import argparse

from pathlib import Path
from datetime import datetime

BLOG_DIR = Path("./content/blog/")

def generate_frontmatter(title: str, date: datetime) -> str:
    return (
        "+++\n"
        f"title = \"{title}\"\n"
        f"date = \"{date.isoformat()}\"\n"
        "description = \"\"\n"
        "tags = []\n"
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new post.")
    parser.add_argument("title", help="The title of the post.")
    args = parser.parse_args()
    now = datetime.now()

    slug = args.title.lower().replace(" ", "-")
    post_dir = BLOG_DIR / slug
    post_dir.mkdir(parents=True, exist_ok=True)
    post_file = post_dir / "index.md"
    if post_file.exists():
        print(f"Post {post_file} already exists.")
        exit(1)

    frontmatter = generate_frontmatter(args.title, now)

    with open(post_file, "w") as f:
        f.write(frontmatter)
        f.write("+++\n\n")
        f.write("Hello world!\n")