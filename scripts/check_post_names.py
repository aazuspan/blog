"""
A pre-commit hook that checks that post folder names match post title slugs.
"""

import sys
import slugify
from pathlib import Path

POST_DIR = Path("/home/az/code/hugo-blog/content/blog")



def check_post_name_matches_slug(post_dir: Path):
    post = post_dir / "index.md"

    if not post.exists():
        raise ValueError(f"Post {post} does not exist.")
    
    with open(post) as f:
        lines = f.readlines()

    title_line = next((line for line in lines if line.startswith("title = ")), None)
    if title_line is None:
        raise ValueError(f"Title could not be parsed.")
    
    title = title_line.split("=", 1)[1].strip().strip('"')
    slug = slugify.slugify(title)

    if post_dir.name != slug:
        raise ValueError(f"Folder name `{post_dir.name}` does not match slug `{slug}`.")


if __name__ == "__main__":
    paths = [Path(path) for path in sys.argv[1:]]
    posts = [path for path in paths if path.name == "index.md"]
        
    for post in posts:
        try:
            check_post_name_matches_slug(post.parent)
        except ValueError as e:
            print(f"Error in {post}: {e}")
            sys.exit(1)
