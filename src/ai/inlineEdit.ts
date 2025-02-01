import * as vscode from 'vscode';
import { AiBuddy } from './aiBuddy';
import { AiBuddyState, updateStatusbar } from '../statusBar';

export async function inlineEdit(aiBuddy: AiBuddy, prompt: string, editor: vscode.TextEditor) {
    updateStatusbar({
        state: AiBuddyState.GENERATING,
        aiBuddy,
        data: prompt
    });

    const fileName = editor.document.fileName;

    const resp = await aiBuddy.chat([
        {
            role: 'system',
            content: 'You are an developer assistant. Repeat the given SourceCode with the requested changes. Only answer in source code.'
        },
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

   /*const fileExtension = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
    const tempUri = vscode.Uri.parse('untitled:AiBuddyTmpFile' + fileExtension);
    */
    const tmpDocument = await vscode.workspace.openTextDocument({
        language: editor.document.languageId,
        content
    });

    const result = await vscode.commands.executeCommand('vscode.diff', tmpDocument.uri, editor.document.uri, 'Ai Buddy Update', {
        preserveFocus: true, // Whether to preserve focus after opening
        preview: true
    } as vscode.TextDocumentShowOptions);

   

    updateStatusbar({
        state: AiBuddyState.READY,
        aiBuddy
    });
}