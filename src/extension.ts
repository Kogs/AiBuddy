import * as vscode from 'vscode';

import { AiBuddyState, initStatusbar, updateStatusbar } from './statusBar';
import { AiBuddy } from './ai/aiBuddy';
import { enableSideBar } from './chatSideBar';

type OllamaConfig = {
    host: string;
    model: string;
}

export async function activate(context: vscode.ExtensionContext) {
    const aiBuddy = new AiBuddy();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
        if (event.affectsConfiguration('aibuddy.ollama')) {
            await initAiBuddy(aiBuddy);
        }
    }));

    initStatusbar(context);
    enableSideBar(context, aiBuddy);
    const inizialized = await initAiBuddy(aiBuddy);

    console.log('Ai Buddy activated successfully: ' + inizialized);
}


export function deactivate() { }

async function initAiBuddy(aiBuddy: AiBuddy) {
    updateStatusbar({ state: AiBuddyState.INITIALIZING });

    const settings = vscode.workspace.getConfiguration('aibuddy');
    const ollamaSettings = settings.get<OllamaConfig>('ollama');
    aiBuddy.host = ollamaSettings?.host || 'http://127.0.0.1:11434';
    aiBuddy.model = ollamaSettings?.model || '';

    try {
        await aiBuddy.init();
    } catch (e: any | Error) {
        updateStatusbar({ state: AiBuddyState.ERROR, aiBuddy, data: e.message });
        await vscode.window.showErrorMessage('Failed to start AI Buddy. ' + e.message);
        return false;
    }
    updateStatusbar({ state: AiBuddyState.READY, aiBuddy });
    return true;
}
