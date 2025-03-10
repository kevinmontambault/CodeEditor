import AddStyle from '../__common__/Style.js';

AddStyle(/*css*/`
    .onscreen-keyboard{
        width: 100vw;
        position: absolute;
        z-index: 999;
        font-size: .8rem;
        bottom: 0;
    }

    .onscreen-keyboard.cursor-moving{
        pointer-events: none;
    }
    
    .center-container{
        pointer-events: none;
    }

    .onscreen-keyboard.cursor-moving .center-container{
        opacity: .2;
    }

    .onscreen-keyboard.collapsed .collapsable{
        display: none;
    }

    .onscreen-keyboard.fullscreen .enter-fullscreen-icon{ display: none; }
    .onscreen-keyboard:not(.fullscreen) .exit-fullscreen-icon{ display: none; }

    .onscreen-keyboard.collapsed .hide-keyboard-icon{ display: none; }
    .onscreen-keyboard:not(.collapsed) .show-keyboard-icon{ display: none; }

    .onscreen-keyboard .cursor{
        position: fixed;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        width: 19px;
        height: 13px;
        background-position-x: left;
        background-image: url('/static/img/aero_arrow_l.cur');
        left: 0;
        top: 0;
        pointer-events: none;
    }

    .onscreen-keyboard .cursor[type="auto"]{
        background-image: url('/static/img/aero_arrow_l.cur');
    }
    
    .onscreen-keyboard .cursor[type="pointer"]{
        background-image: url('/static/img/aero_link_l.cur');
        left: -3px;
    }

    .onscreen-keyboard .cursor[type="text"]{
        background-image: url('/static/img/ibeam.png');
        filter: invert(100%);
        left: -2px;
        top: -4px;
    }

    .onscreen-keyboard .key-row>div{
        position: relative;
        color: #FFF;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        box-sizing: border-box;
        opacity: 0.6;
        font-size: 2vw;
    }

    .onscreen-keyboard .key-row>div:before, .onscreen-keyboard .touchpad:before{
        z-index: -1;
        content: "";
        background: #000;
        position: absolute;
        inset: .1vw;
        border-radius: 0.5vw;
    }

    .onscreen-keyboard .key-row>div.locked:before{
        border: 2px solid #FFF;
    }

    .onscreen-keyboard .key-row>div>svg{
        fill: #FFF;
        aspect-ratio: 1;
        height: 3vw;
    }

    onscreen-keyboard .key-row>div.pressed{
        opacity: 0.8;
    }

    .onscreen-keyboard .touchpad{
        position: relative;
        opacity: 0.6;
        width: 8vw;
    }
`);

function duplicateKeyboardEvent(event){
    return new KeyboardEvent(event.type, {
        timestamp:  event.timestamp,
        bubbles:    event.bubbles,
        cancelable: event.cancelable,
        shiftKey:   event.shiftKey,
        ctrlKey:    event.ctrlKey,
        altKey:     event.altKey,
        metaKey:    event.metaKey,
        code:       event.code,
        key:        event.key,
        detail:     event.detail,
        view:       event.view,
        composed:   event.composed,
        srcElement: event.srcElement,
        target:     event.target,
        repeat:     event.repeat,
    });
};

function duplicateMouseEvent(event){
    return new MouseEvent(event.type, {
        
    });
};

function hitTest(keyboard, x, y){
    for(const touchpad of keyboard.querySelectorAll('.touchpad')){
        const rect = touchpad.getBoundingClientRect();
        if(rect.top<=y && rect.bottom>=y && rect.left<=x && rect.right>=x){ return touchpad; }
    }
    
    for(const key of keyboard.querySelectorAll('.key-row>div')){
        const rect = key.getBoundingClientRect();
        if(rect.top<=y && rect.bottom>=y && rect.left<=x && rect.right>=x){ return key; }
    }
};

export default class OnscreenKeyboard extends HTMLElement{
    static CLICK_MOVE_THRESH  = 10;  // how many pixels the cursor must move in order to be considered a 'move' event instead of accidental user movement
    static CLICK_HOLD_TIME    = 300; // how long a trackpad must be long-held to dispatch a 'mousedown' event
    static DBL_CLICK_TIME     = 300; // how quickly the trackpad must be tapped to dispatch a 'dblclick' event
    static KEY_LOCK_TIME      = 300; // how clickly a lockable key must be pressed before being 'locked' on
    static HAPTIC_TIMEOUT     = 150; // how long a key must be pressed before a second 'key up' pulse is given
    static MOVE_TIME_THRESH   = 600; // the window where 4 move events must be heard in order for a trackpad to be considered 'moving'
    static SCROLL_TIMEOUT     = 150; // how long after a scroll it takes for a single-touch trackpad movement to be a cursor movement instead of a scroll
    static SCROLL_DIRECTION_Y = 1;   // whether the window scrolls up or down whether the user moves the trackpad up or down

    static isElementFocusable(element){
        if(element.hasAttribute('tabindex')){
            if(element.getAttribute('tabindex').startsWith('-')){ return false; }
            return true;
        }

        if(element.hasAttribute('disabled')){ return false; }

        if(element.tagName === 'INPUT'){ return true; }
        if(element.tagName === 'SELECT'){ return true; }
        if(element.tagName === 'TEXTAREA'){ return true; }
        if(element.tagName === 'BUTTON'){ return true; }
        if(element.tagName === 'DETAILS'){ return true; }
        if(element.tagName === 'IFRAME'){ return true; }

        if(element.hasAttribute('href')){
            if(element.tagName === 'A'){ return true; }
            if(element.tagName === 'AREA'){ return true; }
        }

        if(element.hasAttribute('contentEditable')){ return true; }

        return false;
    };

    constructor(){
        super();

        this.classList.add('onscreen-keyboard', 'collapsed', 'flex-col');

        this.innerHTML = /*html*/`
            <div class="cursor" type="auto"></div>

            <div class="center-container flex-row">
                <div class="left-touchpad touchpad"></div>

                <div class="keyboard-container flex-col flex-fill">
                    <div class="key-row flex-row">
                        <div data-code="Reload"           noemit width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg></div>
                        <div data-code="ToggleFullscreen" noemit width="1.36">
                            <svg class="enter-fullscreen-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"/></svg>
                            <svg class="exit-fullscreen-icon"  xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/></svg>
                        </div>
                        <div data-code="ZoomIn"                  width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Zm-40-60v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg></div>
                        <div data-code="ZoomOut"                 width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400ZM280-540v-80h200v80H280Z"/></svg></div>
                        <div data-code=""                 noemit width="1.36"></div>
                        <div data-code=""                 noemit width="1.36"></div>
                        <div data-code=""                 noemit width="1.36"></div>
                        <div data-code="Save"                    width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/></svg></div>
                        <div data-code="Copy"                    width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg></div>
                        <div data-code="Cut"                     width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M760-120 480-400l-94 94q8 15 11 32t3 34q0 66-47 113T240-80q-66 0-113-47T80-240q0-66 47-113t113-47q17 0 34 3t32 11l94-94-94-94q-15 8-32 11t-34 3q-66 0-113-47T80-720q0-66 47-113t113-47q66 0 113 47t47 113q0 17-3 34t-11 32l494 494v40H760ZM600-520l-80-80 240-240h120v40L600-520ZM240-640q33 0 56.5-23.5T320-720q0-33-23.5-56.5T240-800q-33 0-56.5 23.5T160-720q0 33 23.5 56.5T240-640Zm240 180q8 0 14-6t6-14q0-8-6-14t-14-6q-8 0-14 6t-6 14q0 8 6 14t14 6ZM240-160q33 0 56.5-23.5T320-240q0-33-23.5-56.5T240-320q-33 0-56.5 23.5T160-240q0 33 23.5 56.5T240-160Z"/></svg></div>
                        <div data-code="Paste"                   width="1.36"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm280-560q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z"/></svg></div>
                        <div data-code="ToggleCollapsed"  noemit width="1.36">
                            <svg class="hide-keyboard-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>
                            <svg class="show-keyboard-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
                        </div>
                    </div>

                    <div class="key-row flex-row collapsable">
                        <div data-code="Backquote" data-key1="\`" data-key2="~" repeat width="1.00">${'`'}</div>
                        <div data-code="Digit1"    data-key1="1"  data-key2="!" repeat width="1.00">1</div>
                        <div data-code="Digit2"    data-key1="2"  data-key2="@" repeat width="1.00">2</div>
                        <div data-code="Digit3"    data-key1="3"  data-key2="#" repeat width="1.00">3</div>
                        <div data-code="Digit4"    data-key1="4"  data-key2="$" repeat width="1.00">4</div>
                        <div data-code="Digit5"    data-key1="5"  data-key2="%" repeat width="1.00">5</div>
                        <div data-code="Digit6"    data-key1="6"  data-key2="^" repeat width="1.00">6</div>
                        <div data-code="Digit7"    data-key1="7"  data-key2="&" repeat width="1.00">7</div>
                        <div data-code="Digit8"    data-key1="8"  data-key2="*" repeat width="1.00">8</div>
                        <div data-code="Digit9"    data-key1="9"  data-key2="(" repeat width="1.00">9</div>
                        <div data-code="Digit0"    data-key1="0"  data-key2=")" repeat width="1.00">0</div>
                        <div data-code="Minus"     data-key1="-"  data-key2="_" repeat width="1.00">-</div>
                        <div data-code="Equal"     data-key1="="  data-key2="+" repeat width="1.00">=</div>
                        <div data-code="Backspace"                              repeat width="2.32">Backspace</div>
                        <div data-code="Delete"                                 repeat width="1.00">Del</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="Tab"                                       repeat      width="1.50">Tab</div>
                        <div data-code="KeyQ"         data-key1="q"  data-key2="Q" repeat caps width="1.00">q</div>
                        <div data-code="KeyW"         data-key1="w"  data-key2="W" repeat caps width="1.00">w</div>
                        <div data-code="KeyE"         data-key1="e"  data-key2="E" repeat caps width="1.00">e</div>
                        <div data-code="KeyR"         data-key1="r"  data-key2="R" repeat caps width="1.00">r</div>
                        <div data-code="KeyT"         data-key1="t"  data-key2="T" repeat caps width="1.00">t</div>
                        <div data-code="KeyY"         data-key1="y"  data-key2="Y" repeat caps width="1.00">y</div>
                        <div data-code="KeyU"         data-key1="u"  data-key2="U" repeat caps width="1.00">u</div>
                        <div data-code="KeyI"         data-key1="i"  data-key2="I" repeat caps width="1.00">i</div>
                        <div data-code="KeyO"         data-key1="o"  data-key2="O" repeat caps width="1.00">o</div>
                        <div data-code="KeyP"         data-key1="p"  data-key2="P" repeat caps width="1.00">p</div>
                        <div data-code="BracketLeft"  data-key1="["  data-key2="{" repeat      width="1.00">[</div>
                        <div data-code="BracketRight" data-key1="]"  data-key2="}" repeat      width="1.00">]</div>
                        <div data-code="Backslash"    data-key1="\\" data-key2="|" repeat      width="1.82">\\</div>
                        <div data-code="Home"                                                  width="1.00">Hom</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="Capslock"                                          width="1.75">Caps</div>
                        <div data-code="KeyA"      data-key1="a" data-key2="A" repeat caps width="1.00">a</div>
                        <div data-code="KeyS"      data-key1="s" data-key2="S" repeat caps width="1.00">s</div>
                        <div data-code="KeyD"      data-key1="d" data-key2="D" repeat caps width="1.00">d</div>
                        <div data-code="KeyF"      data-key1="f" data-key2="F" repeat caps width="1.00">f</div>
                        <div data-code="KeyG"      data-key1="g" data-key2="G" repeat caps width="1.00">g</div>
                        <div data-code="KeyH"      data-key1="h" data-key2="H" repeat caps width="1.00">h</div>
                        <div data-code="KeyJ"      data-key1="j" data-key2="J" repeat caps width="1.00">j</div>
                        <div data-code="KeyK"      data-key1="k" data-key2="K" repeat caps width="1.00">k</div>
                        <div data-code="KeyL"      data-key1="l" data-key2="L" repeat caps width="1.00">l</div>
                        <div data-code="Semicolon" data-key1=";" data-key2=":" repeat      width="1.00">;</div>
                        <div data-code="Quote"     data-key1="'" data-key2='"' repeat      width="1.00">'</div>
                        <div data-code="Enter"                                 repeat      width="2.57">Enter</div>
                        <div data-code="End"                                   repeat      width="1.00">End</div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="ShiftLeft"  lockable                                width="2.25">Shift</div>
                        <div data-code="KeyZ"       data-key1="z" data-key2="Z" repeat caps width="1.00">z</div>
                        <div data-code="KeyX"       data-key1="x" data-key2="X" repeat caps width="1.00">x</div>
                        <div data-code="KeyC"       data-key1="c" data-key2="C" repeat caps width="1.00">c</div>
                        <div data-code="KeyV"       data-key1="v" data-key2="V" repeat caps width="1.00">v</div>
                        <div data-code="KeyB"       data-key1="b" data-key2="B" repeat caps width="1.00">b</div>
                        <div data-code="KeyN"       data-key1="n" data-key2="N" repeat caps width="1.00">n</div>
                        <div data-code="KeyM"       data-key1="m" data-key2="M" repeat caps width="1.00">m</div>
                        <div data-code="Comma"      data-key1="," data-key2="<" repeat      width="1.00">,</div>
                        <div data-code="Period"     data-key1="." data-key2=">" repeat      width="1.00">.</div>
                        <div data-code="Slash"      data-key1="/" data-key2="?" repeat      width="1.00">/</div>
                        <div data-code="ShiftRight" lockable                                width="3.08">Shift</div>
                        <div data-code="ArrowUp"                                repeat      width="1.00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg></div>
                    </div>
                    
                    <div class="key-row flex-row collapsable">
                        <div data-code="ControlLeft"  lockable             width="1.40">Ctrl</div>
                        <div data-code="AltLeft"      lockable             width="1.40">Alt</div>
                        <div data-code="Space"        data-key1=" " repeat width="7.64"></div>
                        <div data-code="AltRight"     lockable             width="1.44">Alt</div>
                        <div data-code="ControlRight" lockable             width="1.44">Ctrl</div>
                        <div data-code="ArrowLeft"                  repeat width="1.00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg></div>
                        <div data-code="ArrowRight"                 repeat width="1.00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></div>
                        <div data-code="ArrowDown"                  repeat width="1.00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg></div>
                    </div>
                </div>

                <div class="right-touchpad touchpad"></div>
            </div>

            <div></div>
        `;

        // cursor variables
        this.cursor = this.querySelector('.cursor');
        this.cursorPosition = {x:0, y:0};
        this.windowSize = {width:0, height:0};
        this.clickedButtonsMap = {};
        this.orientation = 'portrait';
        new ResizeObserver(([entry]) => {
            this.windowSize.width = entry.contentRect.height;
            this.windowSize.height = entry.contentRect.width;
            this.orientation = window.innerWidth>window.innerHeight ? 'landscape' : 'portrait';
        }).observe(document.body);
        this.lastHoveredElement = null;

        // position the cursor once the document loads
        if(document.readyState === 'completed'){ this.moveCursor(50, 50); }
        else{ window.addEventListener('load', () => window.requestAnimationFrame(() => this.moveCursor(50, 50))); }
        
        // focus is changed on pointerdown  
        this.focusedElement = null;
        window.addEventListener('pointerdown', downEvent => {
            if(this.focusedElement){
                this.focusedElement.classList.remove('focused');
                this.focusedElement.dispatchEvent(new Event('focusout', {cancelable:true, bubbles:true}));
                this.focusedElement = null;
            }

            // try to find a focusable parent
            let target = downEvent.target;
            while(target?.hasAttribute && !target.hasAttribute('focusable')){ target = target.parentNode; }
            if(target?.hasAttribute){
                this.focusedElement = target;
                this.focusedElement.classList.add('focused');
                this.focusedElement.dispatchEvent(new Event('focusin', {cancelable:true, bubbles:true}));
            }
        });

        // toggle the state of the fullscreen button
        document.addEventListener('fullscreenchange', () => this.classList.toggle('fullscreen', document.fullscreenElement));

        // reroute keyboard events to focused element
        const maybeDuplicateEvent = event => {
            if(!event.isTrusted){ return; }
            const newEvent = duplicateKeyboardEvent(event);
            this.focusedElement?.dispatchEvent(newEvent);
            if(newEvent.defaultPrevented){ event.preventDefault(); }
        };
        window.addEventListener('keydown', maybeDuplicateEvent);
        window.addEventListener('keyup',   maybeDuplicateEvent);

        // whenever there is a pointerdown event, check if it was on any of the keyboard elements
        window.addEventListener('pointerdown', downEvent => {
            if(!downEvent.isTrusted){ return; }

            const hitElement = hitTest(this, downEvent.clientX, downEvent.clientY);
            if(hitElement){
                hitElement.onHit(downEvent);

                downEvent.preventDefault();
                downEvent.stopImmediatePropagation();
            }
        }, true);

        // release the key that was originally pressed by the pointer
        window.addEventListener('pointerup', upEvent => {
            if(!upEvent.isTrusted){ return; }

            const keyElement = this.pressedKeyMap[upEvent.pointerId];
            if(!keyElement){ return; }

            delete this.pressedKeyMap[upEvent.pointerId];

            this.releaseKeyElement(keyElement);
        });

        // scroll state management
        let scrolling = false;
        let scrollTimeout = null;

        // cursor movement
        let heldCount = 0;
        let cursorStart = null;
        let cursorDelta = null;
        const touchpads = Array.from(this.querySelectorAll('.touchpad'));
        for(const touchpad of touchpads){
            touchpad.onHit = downEvent => {
                
                // its the first touchpad to be pressed
                if(!heldCount){
                    cursorStart = {x:this.cursorPosition.x, y:this.cursorPosition.y};
                    cursorDelta = {x:0, y:0};
                    scrolling   = false;
                    this.classList.add('cursor-moving');
                }
                heldCount += 1;

                // keep timestamps of move events so it can be determined if the cursor is actively moving
                const moveEvents = [0, 0, 0, 0];

                // only dispatch mousedown after brief hold
                let   downTriggered = false;
                const movementSum = {x:0, y:0};
                let   downTimeout = setTimeout(() => {
                    if(movementSum.x + movementSum.y < OnscreenKeyboard.CLICK_MOVE_THRESH){
                        this.mouseDown(downEvent.buttons);
                        movementSum.x = 0;
                        movementSum.y = 0;
                        cursorDelta.x = 0;
                        cursorDelta.y = 0;
                        downTriggered = true;
                        navigator.vibrate(30);
                    }
                }, OnscreenKeyboard.CLICK_HOLD_TIME);

                // move cursor relative to starting position
                const moveCallback = moveEvent => {
                    if(!moveEvent.isTrusted || moveEvent.pointerId !== downEvent.pointerId){ return; }

                    // add timestamps of move events so it can be determined if it's moving
                    moveEvents.push(performance.now());
                    moveEvents.shift();
                    touchpad.moving = performance.now()-moveEvents[0] < OnscreenKeyboard.MOVE_TIME_THRESH;
                    
                    // theres another touchpad flagged as moving, so perform a scroll action
                    if(scrolling || touchpad.moving && touchpads.some(t => t.moving && t!==touchpad)){
                        clearTimeout(downTimeout);
                        downTimeout = null;

                        clearTimeout(scrollTimeout);
                        scrolling = true;
                        scrollTimeout = setTimeout(() => scrolling = false, OnscreenKeyboard.SCROLL_TIMEOUT);

                        this.scroll(moveEvent.movementX, OnscreenKeyboard.SCROLL_DIRECTION_Y * moveEvent.movementY);
                    }

                    // no other touchpad is moving, so attempt to move the cursor
                    else{
                        cursorDelta.x += moveEvent.movementX;
                        cursorDelta.y += moveEvent.movementY;
                        movementSum.x += Math.abs(moveEvent.movementX);
                        movementSum.y += Math.abs(moveEvent.movementY);

                        // the cursor has moved enough to not be flagged as a click, so move the cursor
                        if(movementSum.x + movementSum.y > OnscreenKeyboard.CLICK_MOVE_THRESH){
                            cursorDelta.x += moveEvent.movementX;
                            cursorDelta.y += moveEvent.movementY;
                            movementSum.x += Math.abs(moveEvent.movementX);
                            movementSum.y += Math.abs(moveEvent.movementY);
    
                            this.moveCursor(cursorStart.x+cursorDelta.x, cursorStart.y+cursorDelta.y);
                        }
                    }
                    
                    moveEvent.stopImmediatePropagation();
                    moveEvent.preventDefault();
                };
                window.addEventListener('pointermove', moveCallback, true);

                // when pointer is released
                const upCallback = upEvent => {
                    if(!upEvent.isTrusted || upEvent.pointerId !== downEvent.pointerId){ return; }

                    // clear the 'moving' flag
                    touchpad.moving = false;

                    clearTimeout(downTimeout);

                    // remove callbacks
                    window.removeEventListener('pointermove', moveCallback, true);
                    window.removeEventListener('pointercancel', upCallback, true);
                    window.removeEventListener('pointerup', upCallback, true);

                    // only attempt to dispatch an up or click event if the cursors werent scrolling
                    if(!scrolling){

                        // if the mousedown event was triggered, dispatch the accompanying mouseup event
                        if(downTriggered){ this.mouseUp(upEvent.buttons); }

                        // if the cursor didn't really move, AND the mouse wasn't held long enough to dispatch the mousedown event, dispatch a full click event
                        else if(movementSum.x + movementSum.y < OnscreenKeyboard.CLICK_MOVE_THRESH){ window.requestAnimationFrame(() => this.click(upEvent.buttons)); }
                    }

                    heldCount -= 1;
                    if(!heldCount){ this.classList.remove('cursor-moving'); }

                    upEvent.stopImmediatePropagation();
                    upEvent.preventDefault();
                };
                window.addEventListener('pointercancel', upCallback, true);
                window.addEventListener('pointerup', upCallback, true);
            };
        }

        this.capsableKeys  = Array.from(this.querySelectorAll('div[caps]'));
        this.shiftableKeys = Array.from(this.querySelectorAll('div[data-key2]'));
        
        // list of key elements and a map to get a key element given it's id
        this.keys   = Array.from(this.querySelectorAll('div[data-code]'));
        this.keyMap = Object.fromEntries(this.keys.map(key => [key.getAttribute('data-code'), key]));

        // keeps track of which pointer id is currently pressing which key
        this.pressedKeyMap = {};

        // keeps track of which key ids are pressed
        this.pressedKeys = new Set();
        this.capsLockOn = false;

        // keeps track of which keys have repeat intervals
        this.keyRepeatTimeout = null;

        // setup attributes per key element
        for(const keyElement of this.keys){
            
            // add a 'pressedCount' attribute to each key element to keep track of how many pointers have pressed that key down
            keyElement.pressedCount = 0;

            // get attributes from HTML
            if(keyElement.hasAttribute('data-code')){ keyElement.code = keyElement.getAttribute('data-code'); }
            if(keyElement.hasAttribute('data-key1')){ keyElement.key1 = keyElement.getAttribute('data-key1'); }
            if(keyElement.hasAttribute('data-key2')){ keyElement.key2 = keyElement.getAttribute('data-key2'); }
            keyElement.repeat = keyElement.hasAttribute('repeat');
            keyElement.caps   = keyElement.hasAttribute('caps');
            keyElement.key    = keyElement.key1 || keyElement.code;
            keyElement.emit   = !keyElement.hasAttribute('noemit');

            // set key sizes
            const width = parseFloat(keyElement.getAttribute('width'));
            keyElement.style.flex = width;
            keyElement.style.aspectRatio = width;

            // listen for key presses
            keyElement.onHit = downEvent => {
                this.pressedKeyMap[downEvent.pointerId] = keyElement;
                this.pressKeyElement(keyElement);
            };

            if(keyElement.hasAttribute('lockable')){
                keyElement.lockable = true;
            }
        };

        // keeps track of the last timestamp some click events occured, so they can be counted up if occuring shortly after one another
        // for example, these timestamps make sure dblclick event can be dispatched correctly
        this.lastMouseDown = {timestamp:0, counter:0};
        this.lastMouseUp   = {timestamp:0, counter:0};
        this.lastClick     = {timestamp:0, counter:0};
    };

    pressKeyElement(keyElement){
        keyElement.classList.add('pressed');
        keyElement.pressedCount += 1;

        try{ navigator.vibrate(20); }
        catch(err){}

        // a new key was pressed, so remove the old repeat timeout
        if(this.keyRepeatTimeout){
            clearTimeout(this.keyRepeatTimeout);
            this.keyRepeatTimeout = null;
        }

        // handle a key that was pressed for the first time
        if(keyElement.pressedCount === 1){
            this.pressedKeys.add(keyElement.code);

            // change upper-case letters
            if(keyElement.code === 'ShiftLeft' || keyElement.code === 'ShiftRight'){
                for(const key of this.shiftableKeys){
                    key.innerText = key.key2;
                    key.key = key.key2;
                }
            }

            // reload window
            if(keyElement.code === 'Reload'){
                window.location.reload();
            }

            // potentially lock the element
            if(keyElement.lockable){
                if(keyElement.locked){
                    keyElement.classList.remove('locked');
                    keyElement.locked = false;
                }else if(performance.now() - keyElement.lastPress < OnscreenKeyboard.KEY_LOCK_TIME){
                    keyElement.classList.add('locked');
                    keyElement.locked = true;
                }
            }

            // only dispatch a key event if there is a focused element to receive it, and the keyboard key has a key code (isn't a custom action key)
            if(this.focusedElement && keyElement.emit){
                const downEventArgs = {
                    timestamp: performance.now(),
                    bubbles: true,
                    cancelable: true,
                    shiftKey: this.shiftHeld,
                    ctrlKey: this.ctrlHeld,
                    altKey: this.altHeld,
                    metaKey: this.metaHeld,
                    code: keyElement.code,
                    key: keyElement.key,
                    detail: 0,
                    view: window,
                    composed: true,
                    srcElement: this.focusedElement,
                    target: this.focusedElement,
                };

                // add a timeout for key repeats
                if(keyElement.repeat){
                    this.keyRepeatTimeout = setTimeout(function loop(){
                        navigator.vibrate(20);
                        this.focusedElement.dispatchEvent(new KeyboardEvent('keydown', Object.assign({
                            timestamp: performance.now(),
                            repeat: true,
                        }, downEventArgs)));

                        this.keyRepeatTimeout = setTimeout(loop.bind(this), 50);
                    }.bind(this), 500);
                }

                // dispatch keydown
                this.focusedElement.dispatchEvent(new KeyboardEvent('keydown', Object.assign({
                    timestamp: performance.now(),
                    repeat: false,
                }, downEventArgs)));
            }
        }

        // set lastPress, which is used in a few places for haptics and lock mechanics
        keyElement.lastPress = performance.now();
    };
    
    // press a key based on the key code
    pressKey(keyCode){
        const keyElement = this.keyMap[keyCode];
        if(!keyElement){ throw new Error(`No such key '${keyCode}'`); }
        this.pressKeyElement(keyElement);
    };
    
    releaseKeyElement(keyElement){
        keyElement.classList.remove('pressed');
        keyElement.pressedCount -= 1;

        // if they key wasn't rapidly pressed, indicate release
        if(performance.now() - keyElement.lastPress > OnscreenKeyboard.HAPTIC_TIMEOUT){ navigator.vibrate(20); }

        // key isn't actually fully released
        if(keyElement.pressedCount || keyElement.locked){ return; }
        
        // handle a key that was fully released by all pointers
        this.pressedKeys.delete(keyElement.code);

        // remove key repeat timeout if it exists
        if(this.keyRepeatTimeout){
            clearTimeout(this.keyRepeatTimeout);
            this.keyRepeatTimeout = null;
        }

        // toggle the onscreen keyboard
        if(keyElement.code === 'ToggleCollapsed'){ return this.classList.toggle('collapsed'); }

        // toggle fullscreen
        if(keyElement.code === 'ToggleFullscreen'){
            return (async () => {
                try{ await (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()); }
                catch(err){ console.error(err); }
            })();
        }

        // change upper-case letters
        if((keyElement.code === 'ShiftLeft' || keyElement.code === 'ShiftRight') && !this.shiftHeld){
            if(!this.capsLockOn){
                for(const capsableKey of this.capsableKeys){
                    capsableKey.innerText = capsableKey.key1;
                    capsableKey.key = capsableKey.key1;
                }
            }

            for(const shiftableKey of this.shiftableKeys){
                shiftableKey.innerText = shiftableKey.key1;
                shiftableKey.key = shiftableKey.key1;
            }
        }

        // release caps lock
        if(keyElement.code === 'Capslock'){
            this.capsLockOn = !this.capsLockOn;

            if(!this.capsLockOn){
                if(!this.shiftHeld){
                    for(const capsableKey of this.capsableKeys){
                        capsableKey.innerText = capsableKey.key1;
                        capsableKey.key = capsableKey.key1;
                    }
                }
            }else{
                for(const capsableKey of this.capsableKeys){
                    capsableKey.innerText = capsableKey.key2;
                    capsableKey.key = capsableKey.key2;
                }
            }
        }

        if(this.focusedElement){
            this.focusedElement.dispatchEvent(new KeyboardEvent('keyup', {
                timestamp: performance.now(),
                shiftKey: this.shiftHeld,
                ctrlKey: this.ctrlHeld,
                altKey: this.altHeld,
                metaKey: this.metaHeld,
                key: keyElement.key,
            }));
        }
    };

    releaseKey(keyCode){
        const keyElement = this.keyMap[keyCode];
        if(!keyElement){ throw new Error(`No such key '${keyCode}'`); }
        this.releaseKeyElement(keyElement);
    };

    scroll(deltaX, deltaY){
        const element = this.getElementUnderCursor();
        if(!element){ return; }

        const eventArgs = {
            bubbles: true,
            cancelable: true,
            deltaMode: 0,
            deltaX,
            deltaY,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
            screenX: window.screenLeft + this.cursorPosition.x,
            screenY: window.screenTop + this.cursorPosition.y,
            altKey: this.altHeld,
            ctrlKey: this.ctrlHeld,
            shiftKey: this.shiftHeld,
            metaKey: this.metaHeld,
        };
        
        element.dispatchEvent(new WheelEvent('wheel', eventArgs));
    };

    shiftCursor(dx, dy){
        this.moveCursor(this.cursorPosition.x+dx, this.cursorPosition.y+dy);
    };

    moveCursor(x, y){
        // x = Math.min(Math.max(x, 0), this.windowSize.width);
        // y = Math.min(Math.max(y, 0), this.windowSize.height);

        const deltaX = x - this.cursorPosition.x;
        const deltaY = y - this.cursorPosition.y;

        this.cursorPosition.x = x;
        this.cursorPosition.y = y;

        if(this.orientation === 'portrait'){
            this.cursor.style.transform = `translate(${Math.round(this.cursorPosition.y)}px, ${Math.round(this.windowSize.width - this.cursorPosition.x)}px)`;
        }else{
            this.cursor.style.transform = `translate(${Math.round(this.cursorPosition.x)}px, ${Math.round(this.cursorPosition.y)}px)`;
        }

        // pointer enter and leave events
        const element = this.getElementUnderCursor();
        if(element !== this.lastHoveredElement){
            if(this.lastHoveredElement && element && this.lastHoveredElement.contains(element)){

                // add hovered class to all elements between
                let cursorStyle = null;
                let curr = element;
                do{
                    if(!cursorStyle){
                        const cursor = window.getComputedStyle(curr).cursor;
                        if(cursor !== 'auto'){ cursorStyle = cursor; }
                    }
                    curr.classList.add('hovered');
                    curr = curr.parentNode;
                }while(curr !== this.lastHoveredElement);


                this.cursor.setAttribute('type', cursorStyle || 'auto');
    
                element.dispatchEvent(new PointerEvent('pointerenter'));
                element.dispatchEvent(new MouseEvent('mouseenter'));
            }else{
                if(this.lastHoveredElement){
    
                    // remove hovered class from parent elements
                    let curr = this.lastHoveredElement;
                    do{
                        curr.classList.remove('hovered');
                        curr = curr.parentNode;
                    }while(curr && (!element || !curr.contains(element)) && curr.classList);
    
                    this.lastHoveredElement.dispatchEvent(new PointerEvent('pointerleave'));
                    this.lastHoveredElement.dispatchEvent(new MouseEvent('mouseleave'));
                }
    
                if(element){
    
                    // add hovered class to all parent elements
                    let cursorStyle = null;
                    let curr = element;
                    do{
                        if(!cursorStyle){
                            const cursor = window.getComputedStyle(curr).cursor;
                            if(cursor !== 'auto'){ cursorStyle = cursor; }
                        }
                        curr.classList.add('hovered');
                        curr = curr.parentNode;
                    }while(curr && curr.classList && !curr.classList.contains('hovered'));

                    this.cursor.setAttribute('type', cursorStyle || 'auto');
    
                    element.dispatchEvent(new PointerEvent('pointerenter'));
                    element.dispatchEvent(new MouseEvent('mouseenter'));
                }
            }
        }

        // pointer move
        if(element){
            const eventArgs = {
                bubbles: true,
                cancelable: true,
                movementX: deltaX,
                movementY: deltaY,
                clientX: this.cursorPosition.x,
                clientY: this.cursorPosition.y,
                screenX: window.screenLeft + this.cursorPosition.x,
                screenY: window.screenTop + this.cursorPosition.y,
            };
            
            element.dispatchEvent(new PointerEvent('pointermove', eventArgs));
            element.dispatchEvent(new MouseEvent('mousemove', eventArgs));
        }

        this.lastHoveredElement = element;
    };

    click(buttons){
        return this.mouseDown(buttons) && this.mouseUp(buttons) && (buttons!==3 || this.contextMenu());
    };

    leftClick(){
        return this.click(1); // Left mouse button
    };
    
    rightClick(){
        return this.click(2); // right mouse button
    };

    mouseDown(button){
        const elementAtPosition = this.getElementUnderCursor();
        if(!elementAtPosition){ return false; }

        // check for double clicks
        if(this.lastMouseDown.timestamp > Date.now()-OnscreenKeyboard.DBL_CLICK_TIME){ this.lastMouseDown.counter += 1; }
        else{ this.lastMouseDown.counter = 1; }
        this.lastMouseDown.timestamp = Date.now();

        const downEventArgs = {
            bubbles: true,
            cancelable: true,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
            screenX: window.screenLeft + this.cursorPosition.x,
            screenY: window.screenTop + this.cursorPosition.y,
            ctrlKey: this.ctrlHeld,
            shiftKey: this.shiftHeld,
            altKey: this.altHeld,
            metaKey: this.metaHeld,
            buttons: button,
            view: window,
            detail: this.lastMouseDown.counter,
        };
        elementAtPosition.dispatchEvent(new PointerEvent('pointerdown', downEventArgs));
        elementAtPosition.dispatchEvent(new MouseEvent('mousedown', downEventArgs));

        this.clickedButtonsMap[button] = elementAtPosition;

        return true;
    };

    mouseUp(button){
        const elementAtPosition = this.getElementUnderCursor();
        if(!elementAtPosition){ return false; }

        // check for double clicks
        if(this.lastMouseUp.timestamp > Date.now()-OnscreenKeyboard.DBL_CLICK_TIME){ this.lastMouseUp.counter += 1; }
        else{ this.lastMouseUp.counter = 1; }
        this.lastMouseUp.timestamp = Date.now();

        const upEventArgs = {
            bubbles: true,
            cancelable: true,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
            ctrlKey: this.ctrlHeld,
            shiftKey: this.shiftHeld,
            altKey: this.altHeld,
            metaKey: this.metaHeld,
            buttons: button,
            detail: this.lastMouseUp.counter,
        };
        elementAtPosition.dispatchEvent(new PointerEvent('pointerup', upEventArgs));
        elementAtPosition.dispatchEvent(new MouseEvent('mouseup', upEventArgs));

        // pointer down and up on the same element
        if(this.clickedButtonsMap[button] === elementAtPosition){
            elementAtPosition.dispatchEvent(new MouseEvent('click', upEventArgs));

            // double click
            if(this.lastMouseUp.counter === 2){
                elementAtPosition.dispatchEvent(new MouseEvent('dblclick', upEventArgs));
            }
        }

        delete this.clickedButtonsMap[button];

        return true;
    };

    contextMenu(){
        const contextArgs = {
            bubbles: true,
            cancelable: true,
            clientX: this.cursorPosition.x,
            clientY: this.cursorPosition.y,
        };

        elementAtPosition.dispatchEvent(new MouseEvent('contextmenu', contextArgs));
        return true;
    };

    getElementUnderCursor(){
        if(this.classList.contains('cursor-moving')){
            return document.elementFromPoint(this.cursorPosition.x, this.cursorPosition.y) || null;
        }else{
            this.classList.add('cursor-moving');
            const element = document.elementFromPoint(this.cursorPosition.x, this.cursorPosition.y) || null;
            this.classList.remove('cursor-moving');
            return element;
        }
    };

    get shiftHeld(){
        return this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');
    };

    get ctrlHeld(){
        return this.pressedKeys.has('ControlLeft') || this.pressedKeys.has('ControlRight');
    };
    
    get altHeld(){
        return this.pressedKeys.has('AltLeft') || this.pressedKeys.has('AltRight');
    };
    
    get metaHeld(){
        return this.pressedKeys.has('MetaLeft') || this.pressedKeys.has('MetaRight');
    };
};
customElements.define('onscreen-keyboard', OnscreenKeyboard);