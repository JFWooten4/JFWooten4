# DOCX To Markdown Context Menu

This VS Code extension adds `Convert DOCX to Markdown` to the Explorer context
menu for `.docx` files.

It expects this repo layout:

- `chatgpt/docx-to-md.py`
- the selected `.docx` file somewhere inside the opened workspace

Behavior:

1. Runs `chatgpt/docx-to-md.py` against the selected `.docx`
2. Parses the `Wrote ...` output line to find the Markdown file
3. Deletes the original `.docx`
4. Offers to open the new `.md` file

Install locally by linking this folder into:

- `C:\Users\John\.vscode\extensions\jfwooten4.docx-to-md-context-0.0.1`

Then reload VS Code.
