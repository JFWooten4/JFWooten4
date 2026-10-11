# Mt. Gox legal document staging instructions

This pull request stages two historical Mt. Gox PDFs for permanent hosting under `/legal/`:

- `legal/mtgox-business-plan-2013.pdf`
- `legal/mtgox-situation-draft-2014.pdf`

## Required before merge

**Do not merge this pull request until both PDFs carry the approved attribution/accreditation header.**

The attribution work is tracked in WhyDRS/documents issue #6:

https://github.com/WhyDRS/documents/issues/6

The source copies used to stage this pull request came from the historical WhyDRS document tree at commit `9db732cd09b62d0105b44a8f359b6c9bca705f38`:

- https://github.com/WhyDRS/DUNA-docs/blob/9db732cd09b62d0105b44a8f359b6c9bca705f38/comments/S7-27-15/refs/mtgox-business-plan-2013.pdf
- https://github.com/WhyDRS/DUNA-docs/blob/9db732cd09b62d0105b44a8f359b6c9bca705f38/comments/S7-27-15/refs/mtgox-situation-draft-2014.pdf

When the upstream attribution work is ready:

1. Obtain the final attributed versions of both PDFs from the WhyDRS document work.
2. Replace the two PDFs in this folder without changing their filenames.
3. Confirm the attribution/accreditation header is visibly present in each PDF.
4. Confirm the rest of each document remains intact.
5. Confirm these shortlinks resolve to the local files:
   - `https://wooten.link/mount-gox-problems` → `/legal/mtgox-business-plan-2013.pdf`
   - `https://wooten.link/mount-gox-explosion` → `/legal/mtgox-situation-draft-2014.pdf`
6. Only then mark the pull request ready to merge.

If the upstream filenames change, preserve the filenames used in this repository so the public shortlinks remain stable.
