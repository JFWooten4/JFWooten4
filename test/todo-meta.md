Process `The Transfer of Stock.pdf` locally using Python, PyMuPDF, and appropriate OCR and image-processing tools. Preserve the original source file and create a single archival-quality PDF.

### 1. Normalize and deduplicate
- Standardize all pages to 407.5 × 696.95 PDF points.
- Preserve scan proportions, resolution, and image quality without stretching or cropping printed content.
- Independently verify and remove the redundant scans at these original, one-based PDF page ranges:

  `177-178,211-212,261-262,273-274,287-288,313-314,367-368`

- Retain the most complete and legible version of every printed page.

### 2. Insert missing-page placeholders
Insert the supplied PDFs for printed pages 41, 42, 557, and 558 at their respective positions. Preserve their text layers.

### 3. Repair scanning defects
Conduct a comprehensive visual audit of the entire document, paying particular attention to printed pages 39, 40, 369, 370, 555, 556, and 1070.

- Use the supplied corrected page 556 if available.
- Remove colored scanner streaks, unnecessary black borders, and other identifiable scanning artifacts.
- Reduce background discoloration.
- Deskew tilted pages.
- Align margins consistently across the volume.
- Preserve handwritten markings, library stamps, footnotes, and other historically relevant features.
- Never fabricate missing text or reconstruct missing paper containing text without a verified alternative source.
- Keep an unaltered copy of every scan that undergoes image correction.

### 4. OCR
- Add an invisible, selectable OCR text layer throughout the document.
- Preserve the original scanned images wherever possible.
- Recognize historical typography, legal citations, footnotes, Roman numerals, and section numbering.
- Preserve correct reading order.
- Make the document searchable and suitable for text selection and highlighting.
- Do not OCR over existing accurate text layers.

### 5. Navigation
- Add PDF page labels corresponding to printed page numbers, including Roman-numeral front matter.
- Create hierarchical bookmarks for all 27 chapters, sections, appendices, forms, bibliography, tables, and index.
- Make the original table of contents clickable.
- Link internal section and page references where their destinations can be verified.
- Verify every navigation destination against actual printed page numbering.

### 6. Metadata
Set the following descriptive metadata:
- Title: The Transfer of Stock
- Author: Francis T. Christy
- Publisher: Baker, Voorhis & Co.
- Publication place: New York
- Publication year: 1929
- Language: English

Distinguish the original publication date from the digital restoration date.

### 7. Final verification
- Confirm that every unique printed page is accounted for.
- Verify all page dimensions and printed page sequences.
- Compare SHA-256 hashes of unchanged embedded scans against the originals.
- Document intentional image modifications separately.
- Verify OCR accuracy, bookmarks, page labels, hyperlinks, and metadata.
- Report remaining damage and any unrecoverable text.
- Confirm the expected total of 1,094 PDF pages, including the four placeholders, unless further verified scanning errors require correction.

### 8. Output
Save one complete document as `The Transfer of Stock - Restored.pdf`.

Do not split the PDF or reduce image quality to accommodate upload limits. Produce a verification report documenting every removal, insertion, correction, and unresolved defect. Preserve all original source files.
