const input = document.createElement('textarea');
Object.assign(input.style, {
    position: 'absolute',
    left: 0,
    top: 0,
    border: 'none',
    width: 0,
    height: 0,
    padding: 0,
    margin: 0,
});
document.body.appendChild(input);

export default {
    read: () => {
        input.value - '';
        input.focus();
        try{ document.execCommand('paste'); }
        catch(err){ console.error('Unable to read from clipboard', err); return ''; }
        return input.value;
    },

    write: text => {
        input.value = text;
        input.focus();
        input.select();
        try{ document.execCommand('copy'); }
        catch(err){ console.error('Unable to write to clipboard', err); return ''; }
    },
};