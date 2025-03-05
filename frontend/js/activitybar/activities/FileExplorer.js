import AddStyle from '../../__common__/Style.js';
import Remote from '../../__common__/Remote.js';
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
            const response = await Remote.readFolder(this.fullPath);
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
`);

export default class FileExplorer extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"/></svg>`;
    static name = 'explorer';

    constructor(){
        super();

        this.classList.add('file-explorer', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="root-name"></div>

            <div class="file-tree flex-fill scroll-container">
            </div>
        `;

        this.root = null;
        this.openFolder('Random/Node/CodeEditor');
    };

    // renders a root folder
    openFolder(directory){
        if(this.root){ this.closeFolder(); }

        this.querySelector('.root-name').textContent = '';
        this.querySelector('.file-tree').appendChild(new FolderEntry(directory, directory, 0));

        this.root = directory;
    };
    
    closeFolder(){
        this.querySelector('.root-name').textContent = '';

        const fileTree = this.querySelector('.file-tree');
        while(fileTree.firstChild){ fileTree.firstChild.remove(); }
    };

    reload(){
        
    };
};
customElements.define('file-explorer', FileExplorer);