import { Message, Ollama } from 'ollama';
import * as vscode from 'vscode';

type OllamaConfig = {
    host: string;
    model: string;
}

export class AiBuddy {

    public readonly host: string;
    public readonly model: string;
    private ollama: Ollama | undefined;

    constructor() {
        const settings = vscode.workspace.getConfiguration('aihelper');
        const ollamaSettings = settings.get<OllamaConfig>('ollama');
        this.host = ollamaSettings?.host || 'http://127.0.0.1:11434';
        this.model = ollamaSettings?.model || '';
    }

    public async init() {
        this.ollama = new Ollama({ 
            host: this.host 
        });
        const list = await this.ollama.list();
        const selectedModel = list.models.find((m) => m.name === this.model);
        if (selectedModel === undefined) {
            throw new Error(`Model "${this.model}" is not installed.`);
        }
    }


    public chat(message: Message, systemMessage: Message, messages: Message[] = []) {
        return this.ollama?.chat({
            model: this.model,
            messages: [
                systemMessage,
                ...messages,
                message
            ]
        });
    }


}

