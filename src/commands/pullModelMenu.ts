import * as vscode from 'vscode';
import { AiBuddy } from '../ai/aiBuddy';

export function createPullModelCommand(context: vscode.ExtensionContext, aiBuddy: AiBuddy) {
    context.subscriptions.push(
        vscode.commands.registerCommand('aibuddy.showPullModelMenu', async (suggestedModel: string = 'deepseek-r1:1.5b') => {
            const userInput = await vscode.window.showInputBox({
                title: 'Ai Buddy: Download a model from the ollama library',
                prompt: 'See [https://ollama.com/search](https://ollama.com/search) for avaiaible model names.',
                placeHolder: "Enter model name",
                ignoreFocusOut: true,
                value: suggestedModel
            });
            if (!userInput) {
                return;
            }
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Window,
                    title: `Pulling ${userInput} from ollama library.`,
                    cancellable: true,
                },
                async (progress, token) => {
                    try {
                        const pullModel = await aiBuddy.pullModel(userInput);
                        for await (const part of pullModel) {
                            if (token.isCancellationRequested) {
                                pullModel.abort();
                                break;
                            }
                            const prgs = Math.round(part.completed / part.total * 100);
                            progress.report({
                                message: `${part.status} [${prgs || 0}%]`,
                            });
                        }
                        progress.report({
                            increment: 100
                        });
                    } catch (e: any) {
                        console.error('Failed to pull model', e);
                        vscode.window.showErrorMessage(`Ai Buddy: Failed to pull model ${userInput}. [${e.message}]`);
                    }
                }
            );
            return userInput;
        })
    );


}

