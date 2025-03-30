from pathlib import Path
import warnings

POST_DIR = Path("/home/az/code/hugo-blog/content/blog")
RESOURCE_DIR = Path("/home/az/code/hugo-blog/static")

def bundle_post(post: Path):
    """
    Convert a post in the post root directory to a page bundle by:

    1. Creating a folder with the same name as the post
    2. Moving the post into the folder and renaming it to index.md
    3. Moving any resources associated with the post into the folder
    4. Updating all links in the post to point to the new resource locations
    """
    # Create a folder with the same name as the post
    post_folder = POST_DIR / post.stem
    post_folder.mkdir(exist_ok=True)

    # Move the post into the folder and rename it to index.md
    post.rename(post_folder / "index.md")

    # Move any resources associated with the post into the folder
    post_resource_folders = list(RESOURCE_DIR.rglob(f"{post.stem}"))
    for resource_folder in post_resource_folders:
        for resource in resource_folder.iterdir():
            if (post_folder / resource.name).exists():
                raise FileExistsError(f"File {resource.name} already exists in {post_folder}")
            if resource.suffix == ".html":
                warnings.warn(f"HTML file {resource.name} may not link correctly. Please check manually.")
            
            resource.rename(post_folder / resource.name)
        
        resource_folder.rmdir()

    # Update all links in the post to point to the new resource locations
    with open(post_folder / "index.md") as f:
        post_content = f.read()
    for resource_folder in post_resource_folders:
        resource_rel_path = resource_folder.relative_to(RESOURCE_DIR)
        replace_str = f"/{resource_rel_path}/"
        post_content = post_content.replace(replace_str, "")

    with open(post_folder / "index.md", "w") as f:
        f.write(post_content)


if __name__ == "__main__":
    # Exclude posts starting with an underscore, like _index.md
    root_posts = list(POST_DIR.glob("[!_]*.md"))
    
    for post in root_posts:
        bundle_post(post)
        print(f"Bundled post {post.stem}")