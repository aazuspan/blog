from pathlib import Path
import subprocess


def convert_notebook(path):
    name = Path(path).stem
    cwd = Path.cwd()
    file_dir = Path("../public/images") / f"{name}_files"
    output = cwd / "posts" / f"{name}.md"

    subprocess.run(["jupyter", "nbconvert", "--to", "markdown", "--NbConvertApp.output_files_dir", file_dir, path])

    # NextJS wants paths from the public root, so manually replace the markdown paths
    with open(output, "r") as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if line.startswith("!["):
                lines[i] = line.replace("../public", "")
    
    with open(output, "w") as f:
        f.writelines(lines)
        

if __name__ == "__main__":
    notebooks = Path("./posts").glob("*.ipynb")
    for notebook in notebooks:
        convert_notebook(notebook)