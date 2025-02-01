import * as vscode from 'vscode';

export type OllamaConfig = {
    host: string;
    model: string;
}


export function getConfiguration() {
    return vscode.workspace.getConfiguration('aibuddy');
}