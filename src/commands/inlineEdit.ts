import * as vscode from 'vscode';
import { AiBuddy } from '../ai/aiBuddy';
import { inlineEdit } from '../ai/inlineEdit';

export function createInlineEditCommand(context: vscode.ExtensionContext, aiBuddy: AiBuddy) {
    context.subscriptions.push(
        vscode.commands.registerCommand('aibuddy.inlineEdit', async () => {

            const activeEditor = vscode.window.activeTextEditor;
            if(!activeEditor) {
                return;
            }
            console.log(activeEditor.document.languageId);

            const {text} = activeEditor.document.lineAt(activeEditor.selection.active.line);
            
            const input = await vscode.window.showInputBox({
                title: 'Ai Buddy: Inline Edit request',
                placeHolder: 'Enter requested code',
            });
            if (!input) {
                return;
            }
            await inlineEdit(aiBuddy, input, activeEditor);
        })
    );
}

