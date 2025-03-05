import AddStyle from '../__common__/Style.js';
import Remote   from '../__common__/Remote.js';

import EditorTab from './EditorTab.js';
import CodeArea from './CodeArea.js';

let instanceResolver;
let instance = new Promise(resolve => instanceResolver = resolve);
export default instance;

AddStyle(/*css*/`
    .code-editor{
        background-color: var(--editor-background);
        color: var(--editor-foregroud);
    }

    .code-editor .tab-scroll-container{
        position: relative;
        height: 22px;
        box-shadow: 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    }

    .code-editor .tab-container{
        height: 100%;
        gap: 1px;
        background-color: var(--tab-border);
    }
`);

export class CodeEditor extends HTMLElement{
    constructor(){
        if(instance instanceof CodeEditor){ throw new Error('CodeEditor instance already initialized'); }

        super();

        this.classList.add('code-editor', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="tab-scroll-container scroll-container">
                <div class="tab-container flex-row"></div>
            </div>
            
            <div class="file-content flex-fill flex-row relative"></div>

            <div class="footer flex-row"></div>
        `;

        instanceResolver(this);
        instance = this;

        this.fileContentCache = new Map();

        this.openFile('app.js', 'Random/Node/CodeEditor/app.js');
    };

    async openFile(fileName, filePath){

        // see if the file is already open
        const existingTab = EditorTab.getTabByPath(filePath);
        if(existingTab){ return existingTab.active = true; }

        // create a new tab and editor context
        const context = new CodeArea(fileName, filePath);

        // update local file content cache when saved
        context.addEventListener('save', () => this.fileContentCache.set(filePath, context.text));

        if(this.fileContentCache.has(filePath)){
            context.setText(this.fileContentCache.get(filePath));
        }else{
            (async () => {
                context.classList.add('loading');
                const response = await Remote.readFile(filePath);
                context.classList.remove('loading');
    
                if(response.success){
                    this.fileContentCache.set(filePath, response.text);
                    context.setText(response.text);
                    // this.setText(response.text.replace(/ /g, '\t'));
                }else{
                    // errorText.innerText = 'Failed to fetch file';
                    // errorText.classList.remove('hidden');
                }
            })();
        }

        const tab = new EditorTab(fileName, filePath, context);
        this.querySelector('.tab-container').appendChild(tab);
        this.querySelector('.file-content').appendChild(context);

        return true;
    };
};
customElements.define('code-editor', CodeEditor);