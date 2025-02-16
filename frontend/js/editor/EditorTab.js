import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .editor-tab{
        background-color: var(--tab-inactiveBackground);
        color: var(--tab-inactiveForeground);
        font-size: .7rem;
        user-select: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        pointer-events: all;
        gap: 3px;
        padding: 2px 3px 2px 7px;
    }

    .editor-tab.active{
        background-color: var(--editor-background);
    }

    .editor-tab .close-button{
        visibility: hidden;
        pointer-events: all;
        fill: var(--tab-inactiveForeground);
    }
    
    .editor-tab:hover .close-button, .editor-tab.hovered  .close-button{
        visibility: visible;
    }
    
    .editor-tab .close-button:hover, .editor-tab  .close-button.hovered{
        fill: var(--badge-foreground);
        visibility: visible;
    }

    .editor-tab.changes-made:not(.hovered):not(:hover) .close-button{
        visibility: visible;
        border-radius: 100%;
        background-color: var(--tab-inactiveForeground);
        width: 6px;
        height: 6px;
        margin: 7px;
    }
`);

export default class EditorTab extends HTMLElement{
    static activeTab = null;
    static tabs = [];

    static getTabByPath(path){
        return EditorTab.tabs.find(tab => tab.path === path) || null;
    };

    constructor(name, path, editorContext){
        super();

        this.classList.add('editor-tab', 'flex-row');

        this.innerHTML = /*html*/`
            <div class="name">${name}</div>
            <svg class="close-button" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>
        `;

        this.addEventListener('click', () => this.active = true);
        this.querySelector('.close-button').addEventListener('click', () => this.close());

        this.path = path;
        this.name = name;
        this.context = editorContext;

        this.active = true;
    };

    connectedCallback(){
        EditorTab.tabs.push(this);
    };

    disconnectedCallback(){
        const index = EditorTab.tabs.indexOf(this);
        if(index !== -1){ EditorTab.tabs.splice(index, 1); }
    };

    close(){
        if(this.classList.contains('changes-made') && !window.confirm('Unsaved changes')){ return false; }

        this.remove();
        this.context.remove();

        return true;
    };

    set active(value){
        if(value){
            if(EditorTab.activeTab === this){ return true; }
            if(EditorTab.activeTab){ EditorTab.activeTab.active = false; }
            
            EditorTab.activeTab = this;
            this.classList.add('active');
            this.context.classList.remove('hidden');
            return true;
        }else{
            console.log('hide old tab', this.context)
            EditorTab.activeTab = null;
            this.classList.remove('active');
            this.context.classList.add('hidden');
            return false;
        }
    };

    get active(){
        return this.classList.contains('active');
    };
};
customElements.define('editor-tab', EditorTab);