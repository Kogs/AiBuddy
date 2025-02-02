import * as vscode from 'vscode';
import * as path from 'path';
import { AiBuddy } from '../ai/aiBuddy';
import { inlineEdit } from '../ai/inlineEdit';

export function createInlineEditCommand(context: vscode.ExtensionContext, aiBuddy: AiBuddy) {
    context.subscriptions.push(
        vscode.commands.registerCommand('aibuddy.inlineEdit', async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if(!activeEditor) {
                return;
            }
            const input = await vscode.window.showInputBox({
                title: 'Ai Buddy: Inline Edit request',
                placeHolder: 'Enter requested change',
                prompt: `Ask Ai Buddy to change your code. At line ${activeEditor.selection.active.line} in ${path.basename(activeEditor.document.fileName)}`
            });
            if (!input) {
                return;
            }
            await inlineEdit(context, aiBuddy, input, activeEditor);
        })
    );
}

