import FileExplorer from './activities/FileExplorer.js';
import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .activity-button{
        position: relative;
        cursor: pointer;
        border-radius: 4px;
        padding: 6px;
        fill: var(--badge-background);
        pointer-events: all;
    }

    .activity-button.active{
        fill: var(--activityBar-foreground);
    }
    
    .activity-button.active::before{
        content: "";
        position: absolute;
        height: 100%;
        background-color: var(--activityBar-foreground);
        left: 0;
        width: 2px;
    }
    
    .activity-button:hover, .activity-button.hovered{
        fill: var(--activityBar-foreground);
    }
`);

class ActivityButton extends HTMLElement{
    constructor(name, svg){
        super();

        this.classList.add('activity-button', 'flex-center');

        this.innerHTML = svg;

        this.setAttribute('data-target', name);
    };

    set active(state){
        return this.classList.toggle('active', state);
    };

    get active(){
        return this.classList.contains('active');
    };
};
customElements.define('activity-button', ActivityButton);

AddStyle(/*css*/`
    .activity-bar{
        background: var(--activityBar-background);
        font: var(--editor-fontFamily);
    }

    .activity-bar .content-container{
        background-color: var(--menu-background);
        width: 150px;
    }

    .activity-bar .content-container>*{
        flex: 1;
    }
`);

export default class ActivityBar extends HTMLElement{
    constructor(){
        super();

        this.classList.add('activity-bar', 'flex-row');

        this.innerHTML = /*html*/`
            <div class="buttons-container flex-col"></div>
            <div class="content-container hidden flex-row"></div>
        `;
        
        const buttonsContainer = this.querySelector('.buttons-container');
        const contentContainer = this.querySelector('.content-container');
        for(const component of [FileExplorer]){
            const activityButton = new ActivityButton(component.name, component.icon);

            const activity = new component();
            activity.setAttribute('data-name', component.name);
            activity.classList.add('hidden');

            buttonsContainer.appendChild(activityButton);
            contentContainer.appendChild(activity);

            activityButton.addEventListener('click', () => {
                if(activityButton.active){
                    this.hideActivity();
                }else{
                    this.showActivity(component.name);
                }
            });
        }
    };

    showActivity(name, ...args){
        this.hideActivity();

        const newActiveButton = this.querySelector(`.activity-button[data-target="${name}"]`)
        if(newActiveButton){ newActiveButton.active = true; }

        const newActiveContent = this.querySelector(`.content-container>[data-name="${name}"]`);
        if(newActiveContent){
            this.querySelector('.content-container').classList.remove('hidden');

            newActiveContent.classList.remove('hidden');
            newActiveContent.onShow?.(...args);
        }
    };

    hideActivity(){
        const oldActiveButton = this.querySelector('.activity-button.active');
        if(oldActiveButton){
            oldActiveButton.active = false;
            const oldActiveContent = this.querySelector(`.content-container>[data-name="${oldActiveButton.getAttribute('data-target')}"]`);
            if(oldActiveContent){
                oldActiveContent.classList.add('hidden');
                oldActiveContent.onHide?.();
            }
        }

        this.querySelector('.content-container').classList.add('hidden');
    };
};
customElements.define('activity-bar', ActivityBar);