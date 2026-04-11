"use strict";

const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const COMMAND_ID = "jfwooten4.convertDocxToMarkdown";
const PYTHON_CANDIDATES = ["python", "py"];

function activate(context) {
  const output = vscode.window.createOutputChannel("DOCX to Markdown");

  const disposable = vscode.commands.registerCommand(COMMAND_ID, async (resource) => {
    const uri = resource ?? vscode.window.activeTextEditor?.document?.uri;
    if (!uri || uri.scheme !== "file") {
      vscode.window.showErrorMessage("Select a .docx file in the Explorer.");
      return;
    }

    if (path.extname(uri.fsPath).toLowerCase() !== ".docx") {
      vscode.window.showErrorMessage("The selected file is not a .docx file.");
      return;
    }

    try {
      const outputPath = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Converting ${path.basename(uri.fsPath)} to Markdown`,
          cancellable: false
        },
        async () => convertDocx(uri, output)
      );

      const action = await vscode.window.showInformationMessage(
        `Created ${path.basename(outputPath)} and deleted ${path.basename(uri.fsPath)}.`,
        "Open Markdown",
        "Reveal in Explorer"
      );

      if (action === "Open Markdown") {
        const document = await vscode.workspace.openTextDocument(outputPath);
        await vscode.window.showTextDocument(document);
      } else if (action === "Reveal in Explorer") {
        await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(outputPath));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.show(true);
      vscode.window.showErrorMessage(`DOCX conversion failed: ${message}`, "Show Output").then((choice) => {
        if (choice === "Show Output") {
          output.show(true);
        }
      });
    }
  });

  context.subscriptions.push(disposable, output);
}

async function convertDocx(uri, output) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    throw new Error("Open the folder containing this file as a VS Code workspace first.");
  }

  const scriptPath = path.join(workspaceFolder.uri.fsPath, "chatgpt", "docx-to-md.py");
  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`Converter script not found: ${scriptPath}`);
  }

  output.clear();
  output.appendLine(`Input: ${uri.fsPath}`);
  output.appendLine(`Script: ${scriptPath}`);

  const result = await runPythonScript(scriptPath, uri.fsPath, workspaceFolder.uri.fsPath);
  if (result.outputText) {
    output.appendLine("");
    output.appendLine(result.outputText);
  }

  if (result.exitCode !== 0) {
    throw new Error(`Converter exited with code ${result.exitCode}.`);
  }

  const outputPath = parseOutputPath(result.outputText);
  if (!outputPath) {
    throw new Error("Conversion succeeded, but the output path was not reported.");
  }

  try {
    await fs.unlink(uri.fsPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Markdown was created, but deleting the original DOCX failed: ${message}`);
  }

  return outputPath;
}

async function runPythonScript(scriptPath, inputPath, cwd) {
  let lastMissingCommandError = null;

  for (const command of PYTHON_CANDIDATES) {
    try {
      return await runProcess(command, [scriptPath, inputPath], cwd);
    } catch (error) {
      if (isMissingCommand(error)) {
        lastMissingCommandError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastMissingCommandError) {
    throw new Error("Python was not found in PATH.");
  }

  throw new Error("Unable to start Python.");
}

function runProcess(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, {
      cwd,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({
        exitCode,
        outputText: [stdout.trim(), stderr.trim()].filter(Boolean).join("\n")
      });
    });
  });
}

function parseOutputPath(outputText) {
  const lines = outputText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].startsWith("Wrote ")) {
      return lines[i].slice("Wrote ".length).trim();
    }
  }
  return "";
}

function isMissingCommand(error) {
  return Boolean(error && typeof error === "object" && error.code === "ENOENT");
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
