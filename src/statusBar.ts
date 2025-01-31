import * as vscode from 'vscode';
import { AiBuddy } from './ai/aiBuddy';

const ERROR_COLOR = new vscode.ThemeColor("statusBarItem.errorBackground");


export enum AiBuddyState {
    INITIALIZING,
    READY,
    GENERATING,
    ERROR
}
export type StatusBarStateParams = {
    state: AiBuddyState,
    aiBuddy?: AiBuddy,
    data?: any;
}

let statusBarItem: vscode.StatusBarItem;

export function initStatusbar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    return statusBarItem;
}

export function updateStatusbar(state: StatusBarStateParams) {
    statusBarItem.text = `Ai Buddy [${state.aiBuddy?.model}]`;
    statusBarItem.tooltip = undefined;
    statusBarItem.backgroundColor = undefined;

    switch (state.state) {
        case AiBuddyState.INITIALIZING:
            statusBarItem.text = 'Ai Buddy [$(loading~spin)]';
            break;
        case AiBuddyState.READY:
            break;
        case AiBuddyState.GENERATING:
            statusBarItem.text = `$(loading~spin) Ai Buddy [${state.aiBuddy?.model}]`;
            break;
        case AiBuddyState.ERROR:
            statusBarItem.backgroundColor = ERROR_COLOR;
            statusBarItem.tooltip = state.data;
            break;
    }
}

