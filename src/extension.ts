// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as prettier from "prettier";
import { readFileSync } from "fs";

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
        language: 'javascript',
        content,
    });

    vscode.window.showTextDocument(document, {
			viewColumn: vscode.ViewColumn.Beside
		});
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
  let disposable = vscode.commands.registerCommand(
    "prettier-preview.showPreview",
    async () => {
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
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
