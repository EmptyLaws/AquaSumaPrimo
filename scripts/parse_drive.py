"""Extract PDF file IDs from a public Google Drive folder embedded view."""

import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen

FOLDER_ID = ""
EMBED_URL = f"https://drive.google.com/embeddedfolderview?id={FOLDER_ID}#list"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "pdfs.json"
FIRST_DOCUMENT_TITLE = "Cuadro 2026.pdf"

ENTRY_PATTERN = re.compile(
    r'id="entry-([^"]+)"[\s\S]*?'
    r'type/application/pdf[\s\S]*?'
    r'<div class="flip-entry-title">([^<]+)</div>',
    re.IGNORECASE,
)


def fetch_embedded_html() -> str:
    with urlopen(EMBED_URL) as response:
        return response.read().decode("utf-8", errors="ignore")


def parse_pdfs(html: str) -> list[dict[str, str]]:
    documents = []
    seen_ids: set[str] = set()

    for file_id, title in ENTRY_PATTERN.findall(html):
        file_id = file_id.strip()
        title = title.strip()

        if not file_id or file_id in seen_ids:
            continue

        seen_ids.add(file_id)
        documents.append({"id": file_id, "title": title})

    return documents


def prioritize_first(documents: list[dict[str, str]]) -> list[dict[str, str]]:
    for index, doc in enumerate(documents):
        if doc["title"] == FIRST_DOCUMENT_TITLE:
            return [doc, *documents[:index], *documents[index + 1 :]]
    return documents


def main() -> None:
    html_path = Path(__file__).resolve().parent.parent / "drive_embedded.html"
    html = html_path.read_text(encoding="utf-8", errors="ignore") if html_path.exists() else fetch_embedded_html()

    documents = prioritize_first(parse_pdfs(html))
    print(f"Found {len(documents)} PDFs")

    if not documents:
        print("No PDFs found.", file=sys.stderr)
        sys.exit(1)

    OUTPUT_PATH.write_text(
        json.dumps({"documents": documents}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
