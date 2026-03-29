#!/usr/bin/env python3
"""
Convert a DOCX file to Markdown and normalize linked citation markers into
Markdown footnotes.
"""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from collections import OrderedDict
from pathlib import Path
from typing import Iterable
import xml.etree.ElementTree as ET


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}

CITATION_RE = re.compile(r"\[(\d+)\]")
BIBLIO_RE = re.compile(r"^(?:\[\d+\]\s+)+.+")
URL_RE = re.compile(r"^https?://\S+$")


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert DOCX to Markdown.")
    parser.add_argument("input", nargs="?", help="Path to the DOCX file.")
    parser.add_argument("-o", "--output", help="Output Markdown path.")
    args = parser.parse_args()

    input_path = resolve_input(args.input)
    if input_path is None:
        print("No DOCX file found.", file=sys.stderr)
        return 1

    markdown = render_docx(input_path)
    output_path = derive_output_path(input_path, args.output, markdown)
    output_path.write_text(markdown, encoding="utf-8")
    print(f"Wrote {output_path}")
    return 0


def resolve_input(raw_input: str | None) -> Path | None:
    if raw_input:
        path = Path(raw_input).expanduser().resolve()
        return path if path.exists() else None

    docx_files = sorted(Path.cwd().glob("*.docx"), key=lambda p: p.name.lower())
    return docx_files[0].resolve() if docx_files else None


def render_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        document_root = ET.fromstring(archive.read("word/document.xml"))

    body = document_root.find("w:body", NS)
    if body is None:
        raise ValueError(f"No document body found in {path}")

    blocks = []
    for child in body:
        tag = local_name(child.tag)
        if tag == "p":
            paragraph = parse_paragraph(child)
            if paragraph["text"].strip():
                blocks.append(paragraph)
        elif tag == "tbl":
            table = parse_table(child)
            if table:
                blocks.append({"kind": "table", "text": table})

    paragraphs = [block for block in blocks if block["kind"] == "paragraph"]
    bib_start = find_bibliography_start(paragraphs)
    bibliography = extract_bibliography(paragraphs[bib_start:]) if bib_start is not None else {}

    content_blocks = []
    paragraph_index = 0
    for block in blocks:
        if block["kind"] == "paragraph":
            if bib_start is not None and paragraph_index >= bib_start:
                paragraph_index += 1
                continue
            content_blocks.append(block)
            paragraph_index += 1
        else:
            content_blocks.append(block)

    used_notes: OrderedDict[str, str] = OrderedDict()
    rendered: list[str] = []

    for block in content_blocks:
        if block["kind"] == "table":
            rendered.append(convert_citations(block["text"], bibliography, used_notes))
            rendered.append("")
            continue

        text = convert_citations(block["text"], bibliography, used_notes).strip()
        if not text:
            continue

        style = block["style"]
        if style.startswith("Heading"):
            level_match = re.search(r"(\d+)$", style)
            level = int(level_match.group(1)) if level_match else 1
            rendered.append(f"{'#' * level} {text}")
        elif style == "SourceCode":
            rendered.append("```text")
            rendered.append(text)
            rendered.append("```")
        elif block["is_list"]:
            rendered.append(f"- {text}")
        else:
            rendered.append(text)
        rendered.append("")

    for key, value in used_notes.items():
        rendered.append(f"[^{key}]: {value}")

    return "\n".join(rendered).rstrip() + "\n"


def derive_output_path(input_path: Path, raw_output: str | None, markdown: str) -> Path:
    if raw_output:
        return Path(raw_output).expanduser().resolve()

    suggested_name = suggest_output_name(markdown) or input_path.stem
    return input_path.with_name(f"{suggested_name}.md").resolve()


def suggest_output_name(markdown: str) -> str | None:
    for line in markdown.splitlines():
        cleaned = line.strip()
        if not cleaned:
            continue
        if cleaned.startswith("[^"):
            continue

        cleaned = re.sub(r"^#{1,6}\s+", "", cleaned)
        cleaned = re.sub(r"\[\^[A-Za-z0-9\-]+\]", "", cleaned)
        slug = slugify_filename(cleaned)
        if slug:
            return slug
    return None


def slugify_filename(text: str, max_length: int = 80) -> str:
    text = text.strip().lower()
    text = re.sub(r"[\\/:*?\"<>|]+", " ", text)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-._")
    if not text:
        return ""
    return text[:max_length].rstrip("-._")


def parse_paragraph(paragraph: ET.Element) -> dict[str, object]:
    style = ""
    p_style = paragraph.find("./w:pPr/w:pStyle", NS)
    if p_style is not None:
        style = p_style.attrib.get(f"{{{NS['w']}}}val", "")

    is_list = paragraph.find("./w:pPr/w:numPr", NS) is not None
    text = "".join(paragraph_text_parts(paragraph)).strip()
    return {"kind": "paragraph", "style": style, "is_list": is_list, "text": collapse_spacing(text)}


def parse_table(table: ET.Element) -> str:
    rows: list[list[str]] = []
    for row in table.findall("./w:tr", NS):
        cells: list[str] = []
        for cell in row.findall("./w:tc", NS):
            pieces = []
            for paragraph in cell.findall(".//w:p", NS):
                text = collapse_spacing("".join(paragraph_text_parts(paragraph)).strip())
                if text:
                    pieces.append(text)
            cells.append("<br>".join(escape_pipes(piece) for piece in pieces))
        if cells:
            rows.append(cells)

    if not rows:
        return ""

    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]
    header = normalized[0]
    divider = ["---"] * width
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(divider) + " |",
    ]
    for row in normalized[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def paragraph_text_parts(paragraph: ET.Element) -> Iterable[str]:
    for child in paragraph:
        tag = local_name(child.tag)
        if tag == "r":
            yield run_text(child)
        elif tag == "hyperlink":
            yield "".join(run_text(run) for run in child.findall("./w:r", NS))


def run_text(run: ET.Element) -> str:
    pieces: list[str] = []
    for child in run:
        tag = local_name(child.tag)
        if tag == "t":
            pieces.append(child.text or "")
        elif tag == "tab":
            pieces.append("\t")
        elif tag in {"br", "cr"}:
            pieces.append("\n")
    return "".join(pieces)


def find_bibliography_start(paragraphs: list[dict[str, object]]) -> int | None:
    for index, paragraph in enumerate(paragraphs):
        text = str(paragraph["text"]).strip()
        if BIBLIO_RE.match(text):
            return index
    return None


def extract_bibliography(paragraphs: list[dict[str, object]]) -> dict[str, dict[str, str]]:
    bibliography: dict[str, dict[str, str]] = {}
    i = 0
    while i < len(paragraphs):
        entry = str(paragraphs[i]["text"]).strip()
        if not BIBLIO_RE.match(entry):
            i += 1
            continue

        url = ""
        if i + 1 < len(paragraphs):
            next_text = str(paragraphs[i + 1]["text"]).strip()
            if URL_RE.match(next_text):
                url = next_text
                i += 1

        numbers = CITATION_RE.findall(entry)
        title = CITATION_RE.sub("", entry).strip()
        title = re.sub(r"\s+", " ", title)
        for number in numbers:
            bibliography[number] = {"title": title, "url": url}
        i += 1

    return bibliography


def convert_citations(
    text: str,
    bibliography: dict[str, dict[str, str]],
    used_notes: OrderedDict[str, str],
) -> str:
    def replace(match: re.Match[str]) -> str:
        number = match.group(1)
        entry = bibliography.get(number)
        if entry is None:
            return match.group(0)

        note_id = number
        if note_id not in used_notes:
            if entry["url"]:
                used_notes[note_id] = f"{entry['title']}. <{entry['url']}>"
            else:
                used_notes[note_id] = entry["title"]
        return f"[^{note_id}]"

    text = CITATION_RE.sub(replace, text)
    text = re.sub(r"((?:\[\^[A-Za-z0-9\-]+\])+)([,.;:!?])", r"\2\1", text)
    return text


def escape_pipes(text: str) -> str:
    return text.replace("|", r"\|")


def collapse_spacing(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", " ", text)
    return text.strip()

def local_name(tag: str) -> str:
    return tag.split("}", 1)[-1]


if __name__ == "__main__":
    raise SystemExit(main())
