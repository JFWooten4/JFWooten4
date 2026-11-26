# Build-time PDF reconstruction

From the repository root, split a local original into 25 MiB binary chunks:

```sh
node _scripts/pdf-parts.mjs split "/path/to/The Transfer of Stock.pdf" static/book/transfer-of-stock.pdf
git add _pdf-parts/static/book/transfer-of-stock.pdf
```

Commit the chunk directory and its manifest, not the original PDF. The split command does not remove or overwrite the input. If replacing a previously tracked original at the same static path, remove that tracked source separately after verifying the reconstruction.

Vercel runs the reconstruction after Jekyll has built the site. Each manifest records the size and SHA-256 digest of every chunk and of the complete original. The build fails for missing, unexpected, or corrupt chunks; it publishes the complete PDF at the corresponding static path only after all checks pass.

To verify locally:

```sh
node _scripts/pdf-parts.mjs build
shasum -a 256 "/path/to/The Transfer of Stock.pdf" _site/static/book/transfer-of-stock.pdf
```

The two hashes must match. The chunk storage and scripts are excluded from Jekyll's published site. The generated _site directory is ignored by Git.
