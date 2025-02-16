const styleNode = document.createElement('style');
document.querySelector('head').appendChild(styleNode);

const AddStyle = styleNode.stylesheet ? style => (styleNode.styleSheet.cssText += style) : style => styleNode.appendChild(document.createTextNode(style));
export default AddStyle;

AddStyle(/*css*/`
    .flex-fill{
        flex: 1;
    }

    .flex-col{
        display: flex;
        flex-direction: column;
    }

    .flex-row{
        display: flex;
        flex-direction: row;
    }

    .flex-center{
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .absolute{
        position: absolute;
    }

    .relative{
        position: relative;
    }

    .hidden{
        display: none !important;
    }

    .invisible{
        visibility: hidden;
        pointer-events: none;
    }

    .scroll-container{
        position: relative;
        overflow: auto;
    }

    .scroll-container>*{
        position: absolute;
        width: 100%;
    }

    .pointer-events{
        pointer-events: all;
    }
`);