import AddStyle from '../../__common__/Style.js';
import Host from '../../__common__/Host.js';
import CodeEditor from '../../editor/CodeEditor.js';

class FileEntry extends HTMLElement{
    constructor(name, fullPath){
        super();

        this.classList.add('file-entry', 'pointer-events');

        this.innerHTML = `<div>${name}</div>`;
        
        this.addEventListener('click', () => this.open());

        this.name = name;
        this.fullPath = fullPath;
    };

    async open(){
        (await CodeEditor).openFile(this.name, this.fullPath);
    };
};
customElements.define('file-entry', FileEntry);


AddStyle(/*css*/`
    .folder-entry{
        cursor: pointer;
        user-select: none;
        color: #CCC;
        font-size: .8rem;
    }

    .folder-entry>.title:before{
        content: "+";
        margin-right: 3px;
        font-family: monospace;
        position: relative;
        top: -1px;
    }
    
    .folder-entry.expanded>.title:before{
        content: "-";
    }

    .folder-entry.edited{
        color: yellow;
    }

    .folder-entry.added{
        color: green;
    }

    .folder-entry.ignored{
        color: grey;
    }

    .folder-entry .dirents{
        border-left: 1px solid #CCC;
        padding-left: 5px;
        margin-left: 3px;
    }
`);

class FolderEntry extends HTMLElement{
    constructor(name, fullPath, level){
        super();

        this.classList.add('folder-entry', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="title pointer-events flex-row">${name}</div>
            <div class="dirents hidden flex-col"></div>
        `;

        this.fullPath = fullPath;
        this.content = null;
        this.level = level;

        const title = this.querySelector('.title');
        title.addEventListener('click', async () => {
            if(this.expanded){ this.close(); }
            else{this.open(); }
        });

        title.addEventListener('contextmenu', event => {
            // event.preventDefault();
        });
    };

    async open(){
        const dirents = this.querySelector('.dirents');
        dirents.classList.remove('hidden');

        if(!this.content){
            dirents.classList.add('loading');
            const response = await Host.readFolder(this.fullPath);
            dirents.classList.remove('loading');

            if(!response.success){ return console.error(response.error); }

            this.content = response.text.split('\n').map(line => {
                const type = line.charAt(0);
                const name = line.slice(1);

                const entry = type === 'D' ? new FolderEntry(name, `${this.fullPath}/${name}`, this.level+1) : new FileEntry(name, `${this.fullPath}/${name}`);
                dirents.appendChild(entry);
                return entry;
            });
        }

        this.classList.add('expanded');
    };

    close(){
        this.classList.remove('expanded');
        
        const dirents = this.querySelector('.dirents');
        dirents.classList.add('hidden');
        for(const dirent of dirents.children){
            if(dirent instanceof FolderEntry){
                dirent.close();
            }
        }
    };

    get expanded(){
        return this.classList.contains('expanded');
    };
};
customElements.define('folder-entry', FolderEntry);


AddStyle(/*css*/`
    .file-explorer{
        padding: 2px;
    }

    .file-explorer .open-button-container{
        margin-top: 20px;
    }

    .file-explorer .open-button{
        border-radius: 3px;
        background-color: var(--badge-background);
        color: var(--badge-foreground);
        padding: 2px 4px;
        width: 100px;
        cursor: pointer;
        user-select: none;
        font-size: .8rem;
    }
`);

export default class FileExplorer extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"/></svg>`;
    static name = 'explorer';

    constructor(){
        super();

        this.classList.add('file-explorer', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="root-name"></div>

            <div class="open-button-container flex-center">
                <div class="open-button flex-center pointer-events">Open Folder</div>
            </div>

            <div class="file-tree flex-fill scroll-container">
            </div>
        `;

        // prompt the user to select a root folder when the 'open' button is clicked
        this.querySelector('.open-button').addEventListener('click', () => this.promptOpenFolder());

        this.root = null;
    };

    // prompts a user to select a root folder
    promptOpenFolder(){
        this.openFolder('$$$');
    };

    // renders a root folder
    openFolder(directory){
        if(this.root){ this.closeFolder(); }

        this.querySelector('.open-button-container').classList.add('hidden');
        this.querySelector('.root-name').textContent = '';
        this.querySelector('.file-tree').appendChild(new FolderEntry(directory, directory, 0));

        this.root = directory;
    };
    
    closeFolder(){
        this.querySelector('.open-button-container').classList.remove('hidden');
        this.querySelector('.root-name').textContent = '';

        const fileTree = this.querySelector('.file-tree');
        while(fileTree.firstChild){ fileTree.firstChild.remove(); }
    };

    reload(){
        
    };
};
customElements.define('file-explorer', FileExplorer);