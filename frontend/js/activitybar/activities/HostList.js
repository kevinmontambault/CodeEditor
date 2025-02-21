import AddStyle from '../../__common__/Style.js';
import Host from '../../__common__/Host.js';

AddStyle(/*css*/`
    .host-list{
        padding: 2px;
    }

    .host-list .add-button-container{
        margin-top: 20px;
    }

    .host-list .add-button{
        border-radius: 3px;
        background-color: var(--badge-background);
        color: var(--badge-foreground);
        padding: 2px 4px;
        width: 100px;
        cursor: pointer;
        user-select: none;
        font-size: .8rem;
    }

    .host-entry{
        color: var(--badge-foreground);
        font-size: .8rem;
        align-items: center;
        padding: 2px 4px;
    }

    .host-entry .delete-button{
        cursor: pointer;
        fill: var(--badge-foreground);
    }

    .host-entry .delete-button:hover, .host-entry .delete-button.hovered{
        fill: var(--badge-foreground);
    }
`);

class HostEntry extends HTMLElement{
    constructor(host){
        super();

        this.classList.add('host-entry', 'flex-row', 'pointer-events');

        this.innerHTML = `
            <div>${host.name}</div>
            <svg class="delete-button pointer-events" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>
        `;

        this.host = host;

        this.querySelector('.delete-button').addEventListener('click', event => {
            event.stopImmediatePropagation();
            event.preventDefault();
        });

        this.addEventListener('click', event => {
            // Host.setHost();
            event.preventDefault();
        });
    };
};
customElements.define('host-entry', HostEntry);

export default class HostList extends HTMLElement{
    static icon = /*html*/`<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960"><path d="M80-160v-120h80v-440q0-33 23.5-56.5T240-800h600v80H240v440h240v120H80Zm520 0q-17 0-28.5-11.5T560-200v-400q0-17 11.5-28.5T600-640h240q17 0 28.5 11.5T880-600v400q0 17-11.5 28.5T840-160H600Zm40-120h160v-280H640v280Zm0 0h160-160Z"/></svg>`;
    static name = 'host-list';

    constructor(){
        super();

        this.classList.add('host-list', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="hosts-list-container"></div>

            <div class="add-button-container flex-center">
                <div class="add-button flex-center pointer-events">+ Add</div>
            </div>
        `;

        const listContainer = this.querySelector('.hosts-list-container');
        for(const host of Host.hosts){ listContainer.appendChild(new HostEntry(host)); }
    };
};
customElements.define('host-list', HostList);