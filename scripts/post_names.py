"""
Rename post folders to the post slug.
"""

import slugify
from pathlib import Path

POST_DIR = Path("/home/az/code/hugo-blog/content/blog")


def rename_post(post_dir: Path):
    post = post_dir / "index.md"
    if not post.exists():
        print(f"Post {post} does not exist.")
        return
    
    with open(post) as f:
        lines = f.readlines()

    title_line = next((line for line in lines if line.startswith("title = ")), None)
    if title_line is None:
        print(f"No title found in {post}.")
        return
    
    title = title_line.split("=", 1)[1].strip().strip('"')
    slug = slugify.slugify(title)

    new_post_dir = post_dir.parent / slug
    if new_post_dir.exists():
        print(f"Post {new_post_dir} already exists.")
        return
    
    post_dir.rename(new_post_dir)
    print(f"Renamed {post_dir} to {new_post_dir}")


if __name__ == "__main__":
    posts = [post for post in POST_DIR.glob("[!_]*") if post.is_dir() and post.name != "drafts"]
    
    for post in posts:
        rename_post(post)