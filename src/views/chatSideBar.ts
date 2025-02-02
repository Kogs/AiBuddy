import * as vscode from 'vscode';
import * as path from 'path';
import { AiBuddy } from '../ai/aiBuddy';
import { Message } from 'ollama';
import { AiBuddyState, updateStatusbar } from '../statusBar';
import { getWorkspaceContextMessage, SYSTEM_INIT } from '../ai/systemMessage';

export function createChatSideBar(
    context: vscode.ExtensionContext,
    aiBuddy: AiBuddy
) {
    const provider = new SidebarViewProvider(context.extensionUri, aiBuddy);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'aibuddy.chatSideBar', provider, {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
}


type SideBarMessage = {
    type: 'Chat' | 'Response',
    content: string
}


class SidebarViewProvider implements vscode.WebviewViewProvider {


    private messages: Message[] = [];

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly aiBuddy: AiBuddy
    ) { }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.extensionUri.path, 'media')) ]
        };


        webviewView.webview.html = this.getHtmlForWebview(webviewView);
        webviewView.webview.onDidReceiveMessage(async (e: SideBarMessage) => {
            console.log(e);
            const msg = {
                role: 'user',
                content: e.content
            };
            await webviewView.webview.postMessage({
                type: 'Chat',
                content: msg.content
            });
            updateStatusbar({
                state: AiBuddyState.GENERATING,
                aiBuddy: this.aiBuddy
            });
            this.messages.push(msg);
            try {
                const resp = await this.aiBuddy.chat([SYSTEM_INIT, await getWorkspaceContextMessage(), ...this.messages]);
                console.log(resp);
                if (resp?.message) {
                    this.messages.push(resp.message);
                }
                await webviewView.webview.postMessage({
                    type: 'Response',
                    content: resp?.message.content
                });
            } catch (e: any) {
                await webviewView.webview.postMessage({
                    type: 'Response',
                    content: '<span style="color: red;">Failed: ' + e.message + '</span>'
                });
            }
            updateStatusbar({
                state: AiBuddyState.READY,
                aiBuddy: this.aiBuddy
            });


        });
    }

    private getHtmlForWebview(webviewView: vscode.WebviewView): string {
        
        const markedUri = webviewView.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionUri.path, 'media', 'marked.min.js'))
        );

        const styleSheetUri = webviewView.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionUri.path, 'media', 'chatWebView.css'))
        );
        const scriptUri = webviewView.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.extensionUri.path, 'media', 'chatWebView.js'))
        );

        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
                <title>Ai Buddy : Chat</title>
                <link rel="stylesheet" href="${styleSheetUri}">
                <script src="${markedUri}"></script>
                
            </head>
            <body>
                <div id="messages" style="flex-grow: 1;">
                    <div id="noMessages">
                        <h1>Ai Buddy</h1>
                        <span>No messages</span>
                    </div> 
                    <div id="loading" style="display: none" class="message-wrapper">
                        <span class="role">Buddy:</span>
                        <p>
                            Thinking...<br>
                            <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif"/>
                        </p>
                    </div>
                </div>

                <form id="promptForm">
                    <input id="prompt" class="prompt" placeholder="Ask me anything" autofocus>
                    <button type="submit">&gt;</button>
                <form>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }


}
