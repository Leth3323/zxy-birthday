"""Refresh CSS/JS cache versions and verify local page resources. No dependencies."""

import hashlib
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class ResourceCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = set()

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for key in ("src", "href"):
            if key in attrs:
                self.check(attrs[key])
        if "srcset" in attrs:
            for candidate in attrs["srcset"].split(","):
                self.check(candidate.strip().split()[0])

    def check(self, url):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:
            return
        relative = unquote(parts.path)
        target = (ROOT / relative).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            raise ValueError(f"Missing or invalid local resource: {url}")
        self.references.add(target)


def main():
    page = ROOT / "index.html"
    html = page.read_text(encoding="utf-8")
    for resource in ("assets/styles.css", "assets/main.js"):
        version = hashlib.sha256((ROOT / resource).read_bytes()).hexdigest()[:12]
        pattern = r'((?:href|src)="' + re.escape(resource) + r')(?:\?[^"\s]*)?"'
        html, count = re.subn(pattern, lambda match: f'{match[1]}?v={version}"', html)
        if count != 1:
            raise ValueError(f"Expected one reference to {resource}, got {count}")
    checker = ResourceCheck()
    checker.feed(html)
    page.write_text(html, encoding="utf-8")
    print(f"Cache versions updated; {len(checker.references)} local resources verified.")


if __name__ == "__main__":
    main()
