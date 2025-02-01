import { Message, Ollama } from 'ollama';
import * as vscode from 'vscode';


export class AiBuddy {

    public host?: string;
    public model?: string;
    private ollama?: Ollama;

    constructor() {}

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

    public chat(messages: Message[] = []) {
        if (!this.model || !this.ollama) {
            throw new Error('Not inizialized');
        }
        return this.ollama.chat({
            model: this.model,
            messages
        });
    }

    public async getModels() {
        if (!this.ollama) {
            throw new Error('Not inizialized');
        }
        return (await this.ollama.list()).models;
    }

    public async pullModel(model: string) {
        if (!this.ollama) {
            throw new Error('Not inizialized');
        }
        return await this.ollama.pull({
            model,
            stream: true
        });
    }


}

