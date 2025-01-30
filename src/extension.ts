import * as vscode from 'vscode';

import { AiBuddyState, initStatusbar, updateStatusbar } from './statusBar';
import { AiBuddy } from './ai/aiBuddy';
import { enableSideBar } from './chatSideBar';

export async function activate(context: vscode.ExtensionContext) {
    initStatusbar(context);

    updateStatusbar({ state: AiBuddyState.INITIALIZING });

    const aiBuddy = new AiBuddy();
    try {
        await aiBuddy.init();
    } catch (e: any | Error) {
        updateStatusbar({ state: AiBuddyState.ERROR, aiBuddy, data: e.message });
        await vscode.window.showErrorMessage('Failed to start AI Buddy. ' + e.message);
        throw e;
    }
    updateStatusbar({ state: AiBuddyState.READY, aiBuddy });

    enableSideBar(context, aiBuddy);
    console.log('Ai Buddy activated successfully');
}


export function deactivate() { }
