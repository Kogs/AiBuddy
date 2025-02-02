import * as vscode from 'vscode';
import { Message } from "ollama";
import { getConfiguration } from '../config';


export const SYSTEM_INIT: Message = {
    role: 'system',
    content: `You are a helpful developer assistant.` // TODO make configurable
};
export const SYSTEM_INIT_CODE_COMPLETE: Message = {
    role: 'system',
    content: 'You are an developer assistant. Repeat the given SourceCode with the requested changes. Only answer in source code.'
};


export async function getWorkspaceContextMessage(): Promise<Message> {
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
           ${await readProjectConfigFiles()}
        `
    };
}

async function readProjectConfigFiles() {
    const config = getConfiguration();
    const detectProjectFiles = config.get<{enabled: boolean, glob: string, exclude: string }>('context.detectProjectFiles');

    if (detectProjectFiles?.enabled && detectProjectFiles.glob) {
        const files = await vscode.workspace.findFiles(detectProjectFiles.glob, detectProjectFiles.exclude, 10);
        return 'There are the following project configuration files: ' + files.map(f => vscode.workspace.asRelativePath(f.path)).join(',');
    }
    return '';
}
