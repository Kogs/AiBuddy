import * as vscode from 'vscode';
import { AiBuddy } from './ai/aiBuddy';
import { Message } from 'ollama';

export function enableSideBar(
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

    private systemMessage: Message = {
        role: 'system',
        content: `You are an Developer Assistent. Provide usefull programming advice. Short precise answers. Code examples are allowed.` // TODO make configurable
    };
    private messages: Message[] = [];

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly aiBuddy: AiBuddy
    ) { }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtmlForWebview();
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

            const resp = await this.aiBuddy.chat(msg, [
                this.systemMessage,
                ...this.messages
            ]);

            this.messages.push(msg);
            if (resp?.message) {
                this.messages.push(resp.message);
            }
            console.log(resp);
            
            await webviewView.webview.postMessage({
                type: 'Response',
                content: resp?.message.content
            });
        });
    }

    private getHtmlForWebview(): string {
        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
                <title>Ai Buddy : Chat</title>
                <style>
                    body { 
                        font-family: sans-serif;
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        gap: 5px;
                        height: calc(100vh - 20px);
                    }
                    button { 
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: 1px solid var(--vscode-button-border, transparent);
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                     }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .prompt {
                        padding: 10px;
                        resize: none;
                        background-color: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-border, transparent);
                        border-radius: 4px;
                        box-sizing: border-box;
                        cursor: text;
                        width: 100%;
                        color: var(--vscode-input-foreground);
                    }
                    #messages {
                        overflow: auto;
                    }
                    #messages p {
                        white-space: pre-wrap;
                    }
                </style>
            </head>
            <body>
                <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" style="max-width: 200px;"/>

                <div id="messages" style="flex-grow: 1;">
                    <span id="noMessages">No messages</span>
                </div>

                <form id="promptForm">
                    <input id="prompt" class="prompt" placeholder="Ask me anything" autofocus onkeyup="textAreaAdjust(this)">
                    <button type="submit">Click Me</button>
                <form>
                <script>
                    const vscode = acquireVsCodeApi();
                    const noMessages = document.getElementById('noMessages');
                    const messages = document.getElementById('messages');
                    const promptForm = document.getElementById('promptForm');
                    const prompt = document.getElementById('prompt');

                    window.addEventListener('message', ({data}) => {
                        addMessage(data);
                    });
                    promptForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const value = prompt.value;
                        if (value) {
                            vscode.postMessage({ 
                                type: "Chat",
                                content: prompt.value
                            });
                        }
                        prompt.value = '';
                    });
                    function addMessage(message) {
                        noMessages.style.display = 'none';
                        const p = document.createElement("p");
                        p.innerHTML = message.content;
                        messages.append(p);
                    }
                </script>
            </body>
            </html>
        `;
    }


}
