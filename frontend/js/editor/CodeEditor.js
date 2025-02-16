import AddStyle from '../__common__/Style.js';

import EditorContext from './EditorContext.js';
import EditorTab from './EditorTab.js';

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

        // this.openFile('index.js', '/$$$/CSPriceServer/index.js');
    };

    async openFile(fileName, filePath){

        // see if the file is already open
        const existingTab = EditorTab.getTabByPath(filePath);
        if(existingTab){ return existingTab.active = true; }

        // create a new tab and editor context
        const context = new EditorContext(fileName, filePath);

        const tab = new EditorTab(fileName, filePath, context);
        this.querySelector('.tab-container').appendChild(tab);
        this.querySelector('.file-content').appendChild(context);

        return true;
    };
};
customElements.define('code-editor', CodeEditor);