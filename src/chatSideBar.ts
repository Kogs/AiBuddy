import * as vscode from 'vscode';
import * as path from 'path';
import { AiBuddy } from './ai/aiBuddy';
import { Message } from 'ollama';
import { AiBuddyState, updateStatusbar } from './statusBar';

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
        content: `You are a helpful developer assistant.` // TODO make configurable
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
                const resp = await this.aiBuddy.chat([this.systemMessage, ...this.messages]);
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
                    #promptForm {
                        display: flex;
                        width: 100%;
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
                        flex-grow: 1;
                    }
                    #messages {
                        overflow: auto;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    #noMessages {
                        width: 100%;
                        height: 100%;
                        display: block;
                        align-content: center;
                        text-align: center;
                    }
                    #loading {
                        order: 99999;
                        pointer-events: none;
                    }
                    #loading img {
                        width: 100px;
                        margin-top: 10px;
                    }
                    .message-wrapper {
                        margin-top: 5px;
                        margin-bottom: 5px;
                        border: 1px solid transparent;
                        padding: 5px;
                        width: calc(100% - 20px);
                    }
                    .message-wrapper:hover {
                        border: 1px solid var(--vscode-button-border, transparent);
                    }
                    .message-wrapper .role {
                        color: gray;
                    }
                    .message-wrapper p {
                        margin-block-start: 5px;

                    }
                    .message-wrapper .thought {
                        color: gray;
                        display: none; /* maybe show to users collapsed or as a popup or somthing*/
                    }
                    pre {
                        /** todo vscode theme colors! */
                        background: #1e1e1e; /* Dark background */
                        color: #dcdcdc; /* Light text */
                        padding: 1rem; /* Add space around text */
                        border-radius: 8px; /* Rounded corners */
                        font-size: 14px;
                        line-height: 1.5;
                        overflow-x: auto;
                        white-space: pre-wrap;
                        word-break: break-word;
                    }
                    code {
                        background: transparent;
                    }
                    code:not(pre code) { /* inline code snipped */
                        background: #2d2d2d;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 0.95em;
                    }
     
     
                </style>
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
                <script>
                    const vscode = acquireVsCodeApi();
                    const noMessages = document.getElementById('noMessages');
                    const messages = document.getElementById('messages');
                    const promptForm = document.getElementById('promptForm');
                    const prompt = document.getElementById('prompt');
                    const loading = document.getElementById('loading');

                    window.addEventListener('message', ({data}) => addMessage(data));
                    promptForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const value = prompt.value;
                        if (value) {
                            vscode.postMessage({ 
                                type: "Chat",
                                content: prompt.value
                            });
                            noMessages.style.display = 'none';
                            loading.style.display = 'block';
                        }
                        prompt.value = '';
                    });
                    function addMessage(message) {
                        const isResponse = message.type === 'Response';
                        if (isResponse) {
                            loading.style.display = 'none';
                        }
                        const msgContent = document.createElement("div");
                        msgContent.classList.add('message-wrapper');

                        let content = message.content;
                        content = content.replace('<think>', '<div class="thought">');
                        content = content.replace('</think>', '</div>');

                        let html = '<span class="role">' + (isResponse ? 'Buddy:' : 'You:') + '</span>' + marked.parse(content);
                        
                        msgContent.innerHTML = html;
                        messages.append(msgContent);
                        messages.scrollTop = messages.scrollHeight;
                    }
                </script>
            </body>
            </html>
        `;
    }


}
