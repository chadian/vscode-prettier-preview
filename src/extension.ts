// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as prettier from "prettier";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { diffLines } from "diff";

/*
	prettierFormat and openCodeDocument could be setup
	to use the same language as specified from the editor.
	For now, assuming js.
*/

function prettierFormat(content: string) {
  // TODO: Prettier supports config, this would be nice to pull
  // from a prettier project config file if it doesn't do/check
  // this automatically.
  const formatted = prettier.format(content);
  return formatted;
}

function getPrettierActiveContent() {
  const content = getActiveFileContents();
  if (content) {
    return prettierFormat(content);
  }
}

async function openCodeDocument(content: string) {
  const document = await vscode.workspace.openTextDocument({
    language: "javascript",
    content,
  });

  vscode.window.showTextDocument(document, {
    viewColumn: vscode.ViewColumn.Beside,
  });
}

async function openDiff(prettierFormattedContent: string) {
  // TODO: Can this be kept in memory for the vscode diff instead
  // of writing to disk?
  // TODO: Use better method random temp filename

  const activeFileContent = getActiveFileContents();
  if (activeFileContent) {
    const leftFile = resolve(
      tmpdir(),
      `prettier-preview-left-${new Date().getTime()}`
    );
    writeFileSync(leftFile, activeFileContent);

    const rightFile = resolve(
      tmpdir(),
      `prettier-preview-right-${new Date().getTime()}`
    );
    writeFileSync(rightFile, prettierFormattedContent);

    // TODO: Use title of filename instead of entire path;
    vscode.commands.executeCommand(
      "vscode.diff",
      vscode.Uri.file(leftFile),
      vscode.Uri.file(rightFile),
      `Prettier formatting for ${vscode.window.activeTextEditor?.document.fileName}`
    );
  }
}

function getActiveFileContents() {
  const activeEditor: vscode.TextEditor | undefined =
    vscode.window.activeTextEditor;
  const activeFileContents = activeEditor?.document?.getText();

  return activeFileContents;
}

// extract common things between show* into utilities
const commands = {
  "prettier-preview.showPreview": async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Prettier output generated");
    const activeFileContents = getActiveFileContents();
    console.log(`the active file name is ${activeFileContents}`);

    const formatted = getPrettierActiveContent();
    if (formatted) {
      await openCodeDocument(formatted);
    }
  },

  "prettier-preview.showDiff": async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const formatted = getPrettierActiveContent();

    if (formatted) {
      await openDiff(formatted);
    }
  },

  "prettier-preview.copyToClipboard": async () => {
    const content = getPrettierActiveContent();
    if (content) {
      vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(
        "Prettier output copied to clipboard"
      );
    } else {
      vscode.window.showInformationMessage(
        "Could not determine active tab to prettier copy"
      );
    }
  },
};

async function createPrettierStatusBarItem(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  context.subscriptions.push(statusBarItem);
  statusBarItem.show();

  function updateStatusText(diffLines: number, totalLines: number) {
    const percent = 100 - Math.round((diffLines / totalLines) * 100);

    const fifths = Math.round(percent / 20);
    const meter = Array(fifths).fill("💅", 0, fifths).join("");
    console.log({ diffLines, totalLines, percent, fifths, meter });

    statusBarItem.text = `Prettier'o'meter: ${meter}`;
  }

  // set default
  updateStatusText(100, 100);
  statusBarItem.tooltip = "Shows your current prettier rating";

  return {
    update: updateStatusText,
  };
}

function handleEditorTextChange(updaters: { updateStatusBar: any }) {
  const activeFileContents = getActiveFileContents();
  let prettierFormatted;
  if (activeFileContents) {
    prettierFormatted = prettierFormat(activeFileContents);

		// filter is required: https://github.com/kpdecker/jsdiff/issues/271
		// otherwise unchanged lines will still show up in diff
    const diff = diffLines(activeFileContents, prettierFormatted, {
      ignoreWhitespace: false,
      newlineIsToken: false,
    }).filter(({ added, removed }) => added || removed);


    const totalDiffLines = diff.length;
    const totalLines = activeFileContents.split("\n").length;
    console.log({ activeFileContents, prettierFormatted, diff });
    updaters.updateStatusBar(totalDiffLines, totalLines);
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, "prettier-preview" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // Register Commands
  const commandKeys = Object.keys(commands);
  commandKeys.forEach((commandKey) => {
    // TODO: What is a disposable?
    let disposable = vscode.commands.registerCommand(
      commandKey,
      (commands as any)[commandKey]
    );

    context.subscriptions.push(disposable);
  });

  const { update: updateStatusBar } = await createPrettierStatusBarItem(
    context
  );

  // need both of these to keep updated changes in the editor
  // TODO: Use debounce
  // TODO: Would be nice to have configurable to be on save or as typing
  vscode.window.onDidChangeTextEditorSelection(() =>
    handleEditorTextChange({ updateStatusBar })
  );
  vscode.window.onDidChangeActiveTextEditor(() =>
    handleEditorTextChange({ updateStatusBar })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
