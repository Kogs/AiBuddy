import * as vscode from 'vscode';
import { Message } from "ollama";


export const SYSTEM_INIT: Message = {
    role: 'system',
    content: `You are a helpful developer assistant.` // TODO make configurable
};
export const SYSTEM_INIT_CODE_COMPLETE: Message = {
    role: 'system',
    content: 'You are an developer assistant. Repeat the given SourceCode with the requested changes. Only answer in source code.'
};


export function getWorkspaceContextMessage(): Message {
    const activeEditor = vscode.window.activeTextEditor;
    const openFile = activeEditor?.document.fileName ? vscode.workspace.asRelativePath(activeEditor?.document.fileName) : undefined;
    const openDocuments = vscode.workspace.textDocuments.map((d) =>  vscode.workspace.asRelativePath(d.fileName));
    const runningExtensions = vscode.extensions.all.filter((e) => e.isActive).map((e) => e.id);
    
    return {
        role: 'system',
        content: `
            The currently used workspace is called: ${vscode.workspace.name}\n
            The user is editing the ${activeEditor?.document.languageId || 'text'} file '${openFile}'.
            Other avaiaible files are: ${openDocuments.join(',')}
            Active Extensions are: ${runningExtensions.join(',')}
        `
    };
}
