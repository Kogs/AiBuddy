import * as vscode from 'vscode';
import { AiBuddy } from '../ai/aiBuddy';
import { getConfiguration } from '../config';
import { initAiBuddy } from '../extension';

function formatBytesToGB(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + 'GB';
}



export function createSelectModelCommand(context: vscode.ExtensionContext, aiBuddy: AiBuddy) {

    const CUSTOM_MODEL = 'Pull custom model';

    // TODO: would be nice to fetch these information...
    // probably sizes and available tags will change and not be accurate here anymore..
    const SUGGESTED_MODELS = [
        {
            name: 'deepseek-r1',
            tags: [
                { name: '1.5b', downloadSize: '' },
                { name: '7b', downloadSize: '' },
                { name: '8b', downloadSize: '' },
                { name: '14b', downloadSize: '' },
                { name: '32b', downloadSize: '' },
                { name: '70b', downloadSize: '' },
                { name: '671b', downloadSize: '' },
            ]
        },
        {
            name: 'llama3.3',
            tags: [
                { name: '70b', downloadSize: '43GB' },
            ]
        },
        {
            name: 'codellama',
            tags: [
                { name: '7b', downloadSize: '3.8GB' },
                { name: '13b', downloadSize: '7.4GB' },
                { name: '34b', downloadSize: '19GB' },
                { name: '70b', downloadSize: '39GB' },
            ]
        },
        {
            name: 'deepseek-coder-v2',
            tags: [
                { name: '16b', downloadSize: '8.9GB' },
                { name: '236b', downloadSize: '133GB' },
            ]
        },
    ];

    context.subscriptions.push(
        vscode.commands.registerCommand('aibuddy.showSelectModelMenu', async () => {
            const installedModels = await aiBuddy.getModels();
            const installedModelsName = installedModels.map(m => m.name);

            const models: vscode.QuickPickItem[] = installedModels.map(m => ({
                label: m.name,
                description: m.digest,
                detail: `Size: ${formatBytesToGB(m.size)} Parameter: ${m.details.parameter_size} Family: ${m.details.family} Format: ${m.details.format}`
            }));

            const newModel: vscode.QuickPickItem = {
                label: CUSTOM_MODEL,
                description: 'Pull any Ollama model by name.',
                iconPath: new vscode.ThemeIcon('search')
            };

            const pullModels: vscode.QuickPickItem[] = SUGGESTED_MODELS
                .map(m => {
                    const notInstalledtags = m.tags.filter(t => !installedModelsName.includes(m.name + ':' + t.name));
                    return { ...m, notInstalledtags };
                }).filter((m) => m.notInstalledtags.length > 0)
                .flatMap((m) => m.notInstalledtags.map(t => ({
                    label: m.name + ':' + t.name,
                    description: 'Download size: ' + t.downloadSize,
                    iconPath: new vscode.ThemeIcon('cloud-download')
                })));

            const selectedOption = await vscode.window.showQuickPick([
                ...models,
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                newModel,
                { label: '', kind: vscode.QuickPickItemKind.Separator },
                ...pullModels
            ], {
                title: 'Ai Buddy: Select Ollama model',
                placeHolder: 'Model name',
                ignoreFocusOut: true,
            });
            let selectedModel = selectedOption?.label;

            if (selectedModel === CUSTOM_MODEL) {
                selectedModel = await vscode.commands.executeCommand<string>('aibuddy.showPullModelMenu');
            } else if (selectedOption?.iconPath !== undefined) {
                selectedModel = await vscode.commands.executeCommand<string>('aibuddy.showPullModelMenu', selectedModel);
            }

            if (selectedModel) {
                const settings = getConfiguration();
                const currentModel = settings.get('ollama.model');
                if (currentModel !== selectedModel) {
                    await settings.update('ollama.model', selectedModel, vscode.ConfigurationTarget.Global);
                } else { // if setting was not changed we need to trigger reload manaully.
                    await initAiBuddy(aiBuddy);
                }
                vscode.window.showInformationMessage(`Ai Buddy: Now using model "${selectedModel}"`);
            }
        })
    );


}

