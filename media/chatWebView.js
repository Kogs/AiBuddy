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