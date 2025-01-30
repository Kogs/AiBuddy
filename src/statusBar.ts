import * as vscode from 'vscode';
import { AiBuddy } from './ai/aiBuddy';

const ERROR_COLOR = new vscode.ThemeColor("statusBarItem.errorBackground");


export enum AiBuddyState {
    INITIALIZING,
    READY,
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
    statusBarItem.text = `Ai [${state.aiBuddy?.model}]`;
    statusBarItem.tooltip = undefined;
    statusBarItem.backgroundColor = undefined;

    switch (state.state) {
        case AiBuddyState.INITIALIZING:
            statusBarItem.text = '$(loading~spin) Ai [Initializing]';
            break;
        case AiBuddyState.READY:
            break;
        case AiBuddyState.ERROR:
            statusBarItem.backgroundColor = ERROR_COLOR;
            statusBarItem.tooltip = state.data;
            break;
    }


    // if (state.loading) {
    //     statusBarItem.text = '$(loading~spin) Ai';
    // } else {
    //     statusBarItem.text = `Ai [${state.model}]`;
    //     if (state.error) {
    //         statusBarItem.backgroundColor = errorColor;
    //         statusBarItem.tooltip = state.error;
    //     }
    // }
}

