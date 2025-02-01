import * as vscode from 'vscode';
import { AiBuddy } from '../ai/aiBuddy';
import { getConfiguration } from '../config';
import { initAiBuddy } from '../extension';

export function createSelectModelCommand(context: vscode.ExtensionContext, aiBuddy: AiBuddy) {

    context.subscriptions.push(
        vscode.commands.registerCommand('aibuddy.showSelectModelMenu', async () => {
            const models = await aiBuddy.getModels();

            const newModel = 'Pull new model';
            let selection = await vscode.window.showQuickPick([
                newModel,
                ...models.map(m => m.name)
            ], {
                title: 'Ai Buddy: Select Ollama model',
                placeHolder: 'Model name',
                ignoreFocusOut: true,
            });
            if (selection === newModel) {
                selection = await vscode.commands.executeCommand<string>('aibuddy.showPullModelMenu');
            }
            if (selection) {
                const settings = getConfiguration();
                const currentModel = settings.get('ollama.model');
                if (currentModel !== selection) {
                    await settings.update('ollama.model', selection, vscode.ConfigurationTarget.Global);
                } else { // if setting was not changed we need to trigger reload manaully.
                    await initAiBuddy(aiBuddy);
                }
                vscode.window.showInformationMessage(`Ai Buddy: Now using model "${selection}"`);
            }
        })
    );


}

