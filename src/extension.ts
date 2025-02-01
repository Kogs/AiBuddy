import * as vscode from 'vscode';

import { AiBuddyState, createStatusbar, updateStatusbar } from './statusBar';
import { AiBuddy } from './ai/aiBuddy';
import { createChatSideBar } from './views/chatSideBar';
import { createSelectModelCommand } from './commands/selectModelMenu';
import { createPullModelCommand } from './commands/pullModelMenu';
import { getConfiguration, OllamaConfig } from './config';
import { createInlineEditCommand } from './commands/inlineEdit';


export async function activate(context: vscode.ExtensionContext) {
    const aiBuddy = new AiBuddy();

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
        if (event.affectsConfiguration('aibuddy.ollama')) {
            await initAiBuddy(aiBuddy);
        }
    }));

    createStatusbar(context);
    createSelectModelCommand(context, aiBuddy);
    createPullModelCommand(context, aiBuddy);
    createInlineEditCommand(context, aiBuddy);
    createChatSideBar(context, aiBuddy);
    const inizialized = await initAiBuddy(aiBuddy);

    console.log('Ai Buddy activated successfully: ' + inizialized);
}


export function deactivate() { }

export async function initAiBuddy(aiBuddy: AiBuddy) {
    updateStatusbar({ state: AiBuddyState.INITIALIZING });

    const settings = getConfiguration();
    const ollamaSettings = settings.get<OllamaConfig>('ollama');
    aiBuddy.host = ollamaSettings?.host || 'http://127.0.0.1:11434';
    aiBuddy.model = ollamaSettings?.model || '';

    try {
        await aiBuddy.init();
    } catch (e: any | Error) {
        console.error('Ai Buddy initialization failed', e);
        updateStatusbar({ state: AiBuddyState.ERROR, aiBuddy, data: e.message });
        return false;
    }
    updateStatusbar({ state: AiBuddyState.READY, aiBuddy });
    return true;
}
