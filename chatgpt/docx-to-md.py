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

    inputPath = resolveInput(args.input)
    if inputPath is None:
        print("No DOCX file found.", file=sys.stderr)
        return 1

    markdown = renderDocx(inputPath)
    outputPath = deriveOutputPath(inputPath, args.output, markdown)
    outputPath.write_text(markdown, encoding="utf-8")
    print(f"Wrote {outputPath}")
    return 0


def resolveInput(rawInput: str | None) -> Path | None:
    if rawInput:
        path = Path(rawInput).expanduser().resolve()
        return path if path.exists() else None

    docxFiles = sorted(Path.cwd().glob("*.docx"), key=lambda p: p.name.lower())
    return docxFiles[0].resolve() if docxFiles else None


def renderDocx(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        documentRoot = ET.fromstring(archive.read("word/document.xml"))

    body = documentRoot.find("w:body", NS)
    if body is None:
        raise ValueError(f"No document body found in {path}")

    blocks = []
    for child in body:
        tag = localName(child.tag)
        if tag == "p":
            paragraph = parseParagraph(child)
            if paragraph["text"].strip():
                blocks.append(paragraph)
        elif tag == "tbl":
            table = parseTable(child)
            if table:
                blocks.append({"kind": "table", "text": table})

    paragraphs = [block for block in blocks if block["kind"] == "paragraph"]
    bibStart = findBibliographyStart(paragraphs)
    bibliography = extractBibliography(paragraphs[bibStart:]) if bibStart is not None else {}

    contentBlocks = []
    paragraphIndex = 0
    for block in blocks:
        if block["kind"] == "paragraph":
            if bibStart is not None and paragraphIndex >= bibStart:
                paragraphIndex += 1
                continue
            contentBlocks.append(block)
            paragraphIndex += 1
        else:
            contentBlocks.append(block)

    usedNotes: OrderedDict[str, str] = OrderedDict()
    rendered: list[str] = []

    for block in contentBlocks:
        if block["kind"] == "table":
            rendered.append(convertCitations(block["text"], bibliography, usedNotes))
            rendered.append("")
            continue

        text = convertCitations(block["text"], bibliography, usedNotes).strip()
        if not text:
            continue

        style = block["style"]
        if style.startswith("Heading"):
            levelMatch = re.search(r"(\d+)$", style)
            level = int(levelMatch.group(1)) if levelMatch else 1
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

    for key, value in usedNotes.items():
        rendered.append(f"[^{key}]: {value}")

    return "\n".join(rendered).rstrip() + "\n"


def deriveOutputPath(inputPath: Path, rawOutput: str | None, markdown: str) -> Path:
    if rawOutput:
        return Path(rawOutput).expanduser().resolve()

    suggestedName = suggestOutputName(markdown) or inputPath.stem
    return inputPath.with_name(f"{suggestedName}.md").resolve()


def suggestOutputName(markdown: str) -> str | None:
    for line in markdown.splitlines():
        cleaned = line.strip()
        if not cleaned:
            continue
        if cleaned.startswith("[^"):
            continue

        cleaned = re.sub(r"^#{1,6}\s+", "", cleaned)
        cleaned = re.sub(r"\[\^[A-Za-z0-9\-]+\]", "", cleaned)
        slug = slugifyFilename(cleaned)
        if slug:
            return slug
    return None


def slugifyFilename(text: str, maxLength: int = 80) -> str:
    text = text.strip().lower()
    text = re.sub(r"[\\/:*?\"<>|]+", " ", text)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-._")
    if not text:
        return ""
    return text[:maxLength].rstrip("-._")


def parseParagraph(paragraph: ET.Element) -> dict[str, object]:
    style = ""
    pStyle = paragraph.find("./w:pPr/w:pStyle", NS)
    if pStyle is not None:
        style = pStyle.attrib.get(f"{{{NS['w']}}}val", "")

    isList = paragraph.find("./w:pPr/w:numPr", NS) is not None
    text = "".join(paragraphTextParts(paragraph)).strip()
    return {"kind": "paragraph", "style": style, "is_list": isList, "text": collapseSpacing(text)}


def parseTable(table: ET.Element) -> str:
    rows: list[list[str]] = []
    for row in table.findall("./w:tr", NS):
        cells: list[str] = []
        for cell in row.findall("./w:tc", NS):
            pieces = []
            for paragraph in cell.findall(".//w:p", NS):
                text = collapseSpacing("".join(paragraphTextParts(paragraph)).strip())
                if text:
                    pieces.append(text)
            cells.append("<br>".join(escapePipes(piece) for piece in pieces))
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


def paragraphTextParts(paragraph: ET.Element) -> Iterable[str]:
    for child in paragraph:
        tag = localName(child.tag)
        if tag == "r":
            yield runText(child)
        elif tag == "hyperlink":
            yield "".join(runText(run) for run in child.findall("./w:r", NS))


def runText(run: ET.Element) -> str:
    pieces: list[str] = []
    for child in run:
        tag = localName(child.tag)
        if tag == "t":
            pieces.append(child.text or "")
        elif tag == "tab":
            pieces.append("\t")
        elif tag in {"br", "cr"}:
            pieces.append("\n")
    return "".join(pieces)


def findBibliographyStart(paragraphs: list[dict[str, object]]) -> int | None:
    for index, paragraph in enumerate(paragraphs):
        text = str(paragraph["text"]).strip()
        if BIBLIO_RE.match(text):
            return index
    return None


def extractBibliography(paragraphs: list[dict[str, object]]) -> dict[str, dict[str, str]]:
    bibliography: dict[str, dict[str, str]] = {}
    i = 0
    while i < len(paragraphs):
        entry = str(paragraphs[i]["text"]).strip()
        if not BIBLIO_RE.match(entry):
            i += 1
            continue

        url = ""
        if i + 1 < len(paragraphs):
            nextText = str(paragraphs[i + 1]["text"]).strip()
            if URL_RE.match(nextText):
                url = nextText
                i += 1

        numbers = CITATION_RE.findall(entry)
        title = CITATION_RE.sub("", entry).strip()
        title = re.sub(r"\s+", " ", title)
        for number in numbers:
            bibliography[number] = {"title": title, "url": url}
        i += 1

    return bibliography


def convertCitations(
    text: str,
    bibliography: dict[str, dict[str, str]],
    usedNotes: OrderedDict[str, str],
) -> str:
    def replace(match: re.Match[str]) -> str:
        number = match.group(1)
        entry = bibliography.get(number)
        if entry is None:
            return match.group(0)

        noteId = number
        if noteId not in usedNotes:
            if entry["url"]:
                usedNotes[noteId] = f"{entry['title']}. <{entry['url']}>"
            else:
                usedNotes[noteId] = entry["title"]
        return f"[^{noteId}]"

    text = CITATION_RE.sub(replace, text)
    text = re.sub(r"\s+(\[\^[A-Za-z0-9\-]+\])", r"\1", text)
    text = re.sub(r"((?:\[\^[A-Za-z0-9\-]+\])+)([,.;:!?])", r"\2\1", text)
    return text


def escapePipes(text: str) -> str:
    return text.replace("|", r"\|")


def collapseSpacing(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r" *\n *", " ", text)
    return text.strip()


def localName(tag: str) -> str:
    return tag.split("}", 1)[-1]


if __name__ == "__main__":
    raise SystemExit(main())
