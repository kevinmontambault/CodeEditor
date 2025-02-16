const themeNode = document.createElement('link');
themeNode.setAttribute('rel', 'stylesheet');
document.head.appendChild(themeNode);

export default function set(themeName){
    themeNode.setAttribute('href', `themes/${themeName}.css`);
};