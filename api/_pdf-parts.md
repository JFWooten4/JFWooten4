# Build-time PDF reconstruction

From the repository root, split a local original into 25 MiB binary chunks:

```sh
node api/_pdf-parts.mjs split "/path/to/The Transfer of Stock.pdf" static/book/transfer-of-stock.pdf
git add _pdf-parts/static/book/transfer-of-stock.pdf
```

Commit the chunk directory and its manifest, not the original PDF. The split command does not remove or overwrite the input. If replacing a previously tracked original at the same static path, remove that tracked source separately after verifying the reconstruction.

Vercel runs the reconstruction after Jekyll has built the site. Each manifest records the size and SHA-256 digest of every chunk and of the complete original. The build fails for missing, unexpected, or corrupt chunks; it publishes the complete PDF at the corresponding static path only after all checks pass.

To verify locally:

```sh
node api/_pdf-parts.mjs build
shasum -a 256 "/path/to/The Transfer of Stock.pdf" _site/static/book/transfer-of-stock.pdf
```

The two hashes must match. The chunk storage and scripts are excluded from Jekyll's published site. The generated _site directory is ignored by Git.

## Separate, complete PDF volumes

Place independently readable PDFs in `static/book/<book-name>/part-1.pdf`, `part-2.pdf`, and so on, with a `manifest.json` containing `format: "pdf-pages"` and a `parts` array in numeric order. Each entry contains `name`, `size` (bytes) and `gitBlobSha1` (from `git hash-object <file>`).

The build verifies the source blobs, uses qpdf to merge the pages without recompressing image streams, and verifies the resulting PDF structure and total page count. It publishes `static/book/<book-name>.pdf`, not the volume directory. This is a page merge rather than byte-identical reconstruction of an original unsplit PDF; document-level metadata and bookmarks may differ.

Vercel installs qpdf using dnf if it is missing. For local builds install qpdf first (for example, `brew install qpdf` on macOS).
