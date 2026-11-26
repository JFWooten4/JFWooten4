# Splitting large PDFs into raw binary chunks

Binary splitting divides the original file at byte offsets, not page boundaries. The chunks are not independently readable PDFs. Joining them in order reproduces the original file exactly, including its metadata, bookmarks, OCR, and image data.

## Use the repository's build helper

From the repository root, with the original full-resolution PDF available locally:

```sh
node api/_pdf-parts.mjs split \
  "/path/to/The Transfer of Stock.pdf" \
  static/book/transfer-of-stock.pdf
```

This creates 25 MiB chunks and a SHA-256 integrity manifest:

```text
_pdf-parts/static/book/transfer-of-stock.pdf/
  manifest.json
  part-000000
  part-000001
  ...
```

The original is left untouched. Every chunk is below GitHub's 100 MiB per-file limit.

## Verify before committing

Use a separate output path for a raw-only reconstruction check, without altering existing tracked PDF volumes:

```sh
mkdir -p /tmp/stock-pdf-check
cat _pdf-parts/static/book/transfer-of-stock.pdf/part-* \
  > /tmp/stock-pdf-check/transfer-of-stock.pdf
shasum -a 256 "/path/to/The Transfer of Stock.pdf" \
  /tmp/stock-pdf-check/transfer-of-stock.pdf
```

Both hashes must match. Then, if replacing the current separate page volumes, remove their source directory from the tracked tree only after verifying the binary reconstruction. Do not keep both source formats targeting the same output PDF: the build processes the separate volumes after the binary chunks.

```sh
git add _pdf-parts/static/book/transfer-of-stock.pdf
```

Review and commit the chunks and manifest, not the complete original. Vercel reconstructs the PDF in `_site/static/book/transfer-of-stock.pdf` after Jekyll builds. The generated site is ignored by Git.

## Manual alternative (macOS)

```sh
mkdir -p /tmp/stock-pdf-parts
split -b 90m "/path/to/The Transfer of Stock.pdf" /tmp/stock-pdf-parts/part-
cat /tmp/stock-pdf-parts/part-* > /tmp/stock-pdf-parts/reconstructed.pdf
shasum -a 256 "/path/to/The Transfer of Stock.pdf" /tmp/stock-pdf-parts/reconstructed.pdf
```

This manual example creates chunks of up to 90 MiB but does not produce the manifest or naming scheme used by the repository build helper. Use the helper for actual deployments.
