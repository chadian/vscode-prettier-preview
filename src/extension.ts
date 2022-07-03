// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as prettier from "prettier";
import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";

/*
	prettierFormat and openCodeDocument could be setup
	to use the same language as specified from the editor.
	For now, assuming js.
*/

function prettierFormat(fileName: string) {
  const activeContents = readFileSync(fileName).toString();

  // TODO: Prettier supports config, this would be nice to pull
  // from a prettier project config file if it doesn't do/check
  // this automatically.
  const formatted = prettier.format(activeContents);
  return formatted;
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

async function openDiff(left: string, prettierFormatted: string) {
  // TODO: Can this be kept in memory for the vscode diff instead
  // of writing to disk?
  const tmpFile = resolve(tmpdir(), new Date().toString());
  writeFileSync(tmpFile, prettierFormatted);

  const right = tmpFile;
  // TODO: Use title of filename instead of entire path;
  vscode.commands.executeCommand(
    "vscode.diff",
    vscode.Uri.file(left),
    vscode.Uri.file(right),
    `Prettier formatting for ${left}`
  );
}

// extract common things between show* into utilities
const commands = {
  "prettier-preview.showPreview": async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Prettier output generated");

    const activeEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
    const activeFileName = activeEditor?.document?.fileName;
    console.log(`the active file name is ${activeFileName}`);

    if (activeFileName) {
      const formatted = prettierFormat(activeFileName);
      await openCodeDocument(formatted);
    }
  },

  "prettier-preview.showDiff": async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Prettier output generated");

    const activeEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
    const activeFileName = activeEditor?.document?.fileName;
    console.log(`the active file name is ${activeFileName}`);

    if (activeFileName) {
      const formatted = prettierFormat(activeFileName);
      await openDiff(activeFileName, formatted);
    }
  },
};

async function createPrettierStatusBarItem(context: vscode.ExtensionContext) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(statusBarItem);
	statusBarItem.show();
	statusBarItem.text = "Prettier'o'meter: 💅";
	statusBarItem.tooltip = "Prettier'o'meter: 💅";
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
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

	createPrettierStatusBarItem(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
