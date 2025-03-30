"""
Test all hyperlinks in the Hugo blog.
"""

import subprocess


def test_links():
    """
    Test all hyperlinks in the Hugo blog.
    """
    hugo = subprocess.Popen(["hugo", "server", "--port", "1313"])
    try:
        subprocess.run(["linkchecker", "http://localhost:1313"])
    finally:
        hugo.terminate()

if __name__ == "__main__":
    test_links()