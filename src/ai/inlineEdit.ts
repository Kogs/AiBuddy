import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AiBuddy } from './aiBuddy';
import { AiBuddyState, updateStatusbar } from '../statusBar';
import { getWorkspaceContextMessage, SYSTEM_INIT_CODE_COMPLETE } from './systemMessage';

export async function inlineEdit(context: vscode.ExtensionContext, aiBuddy: AiBuddy, prompt: string, editor: vscode.TextEditor) {
    updateStatusbar({
        state: AiBuddyState.GENERATING,
        aiBuddy,
        data: prompt
    });

    const fileName = path.basename(editor.document.fileName);
    // maybe use json messages and response.
    const resp = await aiBuddy.chat([
        SYSTEM_INIT_CODE_COMPLETE,
        getWorkspaceContextMessage(),
        {
            role: 'user',
            content: `\`\`\`${editor.document.languageId}\n${editor.document.getText()}\`\`\``
        },
        {
            role: 'user',
            content: `At line ${editor.selection.active.line} I want the following changes: ${prompt}`
        }
    ]);

    let content = resp.message.content;
    console.log(content);
    const regex = /```[a-zA-Z]*\n(.*?)```/s;
    const match = content.match(regex);
    content = match ? match[1] : '';  

    // create tmp file for diff with original version.
    const tempFilePath = path.join(context.extensionPath, 'temp_' + fileName);
    fs.writeFileSync(tempFilePath, editor.document.getText()); 

    // Replace the content.
    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), content);
    await vscode.workspace.applyEdit(edit);
    
    // Trigger the diff, so user can see what has changed, and revert changes if needed.
    await vscode.commands.executeCommand('vscode.diff', vscode.Uri.file(tempFilePath), editor.document.uri, `Ai Buddy: [${fileName}] ${prompt}`);
    fs.unlinkSync(tempFilePath);

    updateStatusbar({
        state: AiBuddyState.READY,
        aiBuddy
    });
}