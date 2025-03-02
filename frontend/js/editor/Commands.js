import Position from './Position.js';

const getCharPositionUp = (editor, position) => {
    if(position.line <= 0){ return editor.position(position.line, 0); }
    else{ return editor.position(position.line-1, position.col); }
};

const getCharPositionDown = (editor, position) => {
    if(position.line >= editor.lines.length-1){ return editor.position(position.line, editor.lines[position.line].length); }
    else{ return editor.position(position.line+1, position.col); }
};

const getCharPositionLeft = (editor, position) => {
    if(position.col <= 0){
        if(position.line === 0){ return editor.position(0, 0); }
        else{ return editor.position(position.line-1, editor.lines[position.line-1].length); }
    }else{ return editor.position(position.line, Math.min(editor.lines[position.line].length, position.col)-1); }
};

const getCharPositionRight = (editor, position) => {
    if(position.col >= editor.lines[position.line].length){
        if(position.line === editor.lines.length-1){ return editor.position(position.line, position.col); }
        else{ return editor.position(position.line+1, 0); }
    }else{ return editor.position(position.line, Math.min(editor.lines[position.line].length, position.col)+1); }
};

const getWordPositionLeft = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length) - 1;

    if(initialCol === 0){ return editor.position(position.line, 0); }
    if(initialCol === -1){ return getCharPositionLeft(editor, position); }

    let initialChar;
    while(initialCol && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol -= 1; }
    if(initialChar === 0){ return editor.position(position.line, 0); }

    let col = initialCol;
    if(/[a-zA-Z0-9_-]/.test(initialChar)){
        while(col && /[a-zA-Z0-9_-]/.test(lineText.charAt(col-1))){ col -= 1; }
    }else{
        while(col && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col-1))){ col -= 1; }
    }

    return editor.position(position.line, col);
};

const getWordPositionRight = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length);

    if(initialCol === lineText.length-1){ return editor.position(position.line, lineText.length); }
    if(initialCol === lineText.length){ return getCharPositionRight(editor, position); }

    let initialChar;
    while(initialCol<lineText.length && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol += 1; }
    if(initialCol === lineText.length){ return editor.position(position.line, lineText.length); }

    let col = initialCol;
    if(/[a-zA-Z0-9_-]/.test(initialChar)){
        while(col<lineText.length && /[a-zA-Z0-9_-]/.test(lineText.charAt(col))){ col += 1; }
    }else{
        while(col<lineText.length && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col))){ col += 1; }
    }

    return editor.position(position.line, col);
};

const getSubwordPositionLeft = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length) - 1;

    if(initialCol === 0){ return editor.position(position.line, 0); }
    if(initialCol === -1){ return getCharPositionLeft(editor, position); }

    let initialChar;
    while(initialCol && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol -= 1; }
    if(initialChar === 0){ return editor.position(position.line, 0); }

    let col = initialCol;
    if(/[a-z]/.test(initialChar)){
        while(col && /[a-z]/.test(lineText.charAt(col-1))){ col -= 1; }
        if((/[A-Z]/.test(lineText.charAt(col-1)) && /[a-z]/.test(lineText.charAt(col)))){ col -= 1; }
    }else if(/[A-Z]/.test(initialChar)){
        col -= 1;

        if(/[a-z]/.test(lineText.charAt(col-1))){
            while(col && /[a-z]/.test(lineText.charAt(col-1))){ col -= 1; }
        }else{
            while(col && /[A-Z]/.test(lineText.charAt(col-1))){ col -= 1; }
        }
    }else if(/[0-9]/.test(initialChar)){
        while(col && /[0-9]/.test(lineText.charAt(col-1))){ col -= 1; }
    }else{
        while(col && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col-1))){ col -= 1; }
    }

    return editor.position(position.line, col);
};

const getSubwordPositionRight = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length);

    if(initialCol === lineText.length-1){ return editor.position(position.line, lineText.length); }
    if(initialCol === lineText.length){ return getCharPositionRight(editor, position); }

    let initialChar;
    while(initialCol<lineText.length && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol += 1; }
    if(initialCol === lineText.length){ return editor.position(position.line, lineText.length); }

    let col = initialCol;
    if(/[a-z]/.test(initialChar)){
        while(col<lineText.length && /[a-z]/.test(lineText.charAt(col))){ col += 1; }
    }else if(/[A-Z]/.test(initialChar)){
        col += 1;
        if(/[a-z]/.test(lineText.charAt(col))){
            while(col<lineText.length && /[a-z]/.test(lineText.charAt(col))){ col += 1; }
        }else{
            while(col<lineText.length && /[A-Z]/.test(lineText.charAt(col))){ col += 1; }
        }
    }else if(/[0-9]/.test(initialChar)){
        while(col<lineText.length && /[0-9]/.test(lineText.charAt(col))){ col += 1; }
    }else{
        while(col<lineText.length && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col))){ col += 1; }
    }

    return editor.position(position.line, col);
};

export const getWordBoundsAtPosition = (editor, position) => {
    const line = editor.lines[position.line];
    if(!line){ return null; }

    const lineText = line.text;

    const testChar = lineText.charAt(position.col);
    const type = /\w/.test(testChar) ? /\w/ : /\s/.test(testChar) ? /\s/ : /[^\w\s]/;

    let start = position.col;
    while(start && type.test(lineText.charAt(start-1))){ start -= 1; }

    let end = position.col;
    while(end<lineText.length && type.test(lineText.charAt(end))){ end += 1; }

    return {start, end};
};

// returns a new position that is 'charDelta' characters away from 'position'
export const getPositionFrom = (editor, position, charDelta) => {

};

export const deleteSelectionForward = editor => {
    const deleteRanges = editor.ranges.map(range => {
        if(!range.isEmpty){ return range; }
        return editor.range(range.start, getCharPositionRight(editor, range.end));
    });

    return editor.exec({
        delete: deleteRanges,
        ranges: editor.ranges.map(range => editor.range(range.tail))
    });
};

export const deleteSelectionBackwards = editor => {
//     const normalizedRanges = editor.ranges.map(range => range.normal());

//     const deleteRanges = normalizedRanges.map(range => {
//         if(!range.empty){ return range; }
//         return editor.range(getCharPositionLeft(editor, range.head), range.tail);
//     });

//     // const selectionRanges = normalizedRanges.map(range => {
//     //     if(range.empty){ return editor.range(); }
//     // });

//     return editor.exec({
//         delete: deleteRanges,
//         // ranges: deleteRanges.map(range => editor.range(getCharPositionLeft(editor, range.tail)))
//     });
};

export const insertCharacter = character => editor => {
    // return editor.exec({
    //     delete: 0,
    //     insert: editor.ranges.map(range => ({line:range.head.line, col:range.head.col, string:character})),
    //     ranges: editor.ranges.map(range => {
    //         editor.range({line:range.head.line-1, });
    //     })
    // });

    return true;
};

export const cursorMoveUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getCharPositionUp(editor, range.head)))
    });
};

export const cursorMoveDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getCharPositionDown(editor, range.head)))
    });
};

export const cursorMoveLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => {
            if(range.isEmpty){ return editor.range(getCharPositionLeft(editor, range.head)); }
            return editor.range(range.start);
        })
    });
};

export const cursorWordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getWordPositionLeft(editor, range.head)))
    });
};

export const cursorSubwordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getSubwordPositionLeft(editor, range.head)))
    });
};

export const cursorLineLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(editor.position(range.head.line, 0)))
    });
};

export const cursorDocStart = editor => {
    return editor.exec({
        ranges: [editor.range(editor.position(0, 0))]
    });
};

export const cursorMoveRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => {
            if(range.isEmpty){ return editor.range(getCharPositionRight(editor, range.head)); }
            return editor.range(range.end);
        })
    });
};

export const cursorWordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getWordPositionRight(editor, range.head)))
    });
};

export const cursorSubwordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(getSubwordPositionRight(editor, range.head)))
    });
};

export const cursorLineRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => editor.range(editor.position(range.head.line, editor.lines[range.head.line].length)))
    });
};

export const cursorDocEnd = editor => {
    return editor.exec({
        ranges: [editor.range(editor.position(editor.lines.length-1, editor.lines[editor.lines.length-1].length))]
    });
};

export const selectLineUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getCharPositionUp(editor, range.head)), range))
    });
};

export const selectLineDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getCharPositionDown(editor, range.head)), range))
    });
};

export const selectCharLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getCharPositionLeft(editor, range.head)), range))
    });
};

export const selectWordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getWordPositionLeft(editor, range.head)), range))
    });
};

export const selectSubwordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getSubwordPositionLeft(editor, range.head)), range))
    });
};

export const selectLineLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = editor.position(range.head.line, 0)), range))
    });
};

export const selectDocStart = editor => {
    const maxPosition = editor.ranges.map(range => range.end).reduce((a, b) => Position.lessThan(a, b) ? a : b );

    return editor.exec({
        ranges: [editor.range(maxPosition, editor.position(0, 0))]
    });
};

export const selectAll = editor => {
    return editor.exec({
        ranges: [editor.range(editor.position(0, 0), editor.position(editor.lines.length-1, editor.lines[editor.lines.length-1].length))]
    });
};

export const selectCharRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getCharPositionRight(editor, range.head)), range))
    });
};

export const selectWordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getWordPositionRight(editor, range.head)), range))
    });
};

export const selectSubwordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = getSubwordPositionRight(editor, range.head)), range))
    });
};

export const selectLineRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => ((range.head = editor.position(range.head.line, editor.lines[range.head.line].length)), range))
    });
};

export const selectDocEnd = editor => {
    const minPosition = editor.ranges.map(range => range.start).reduce((a, b) => Position.lessThan(a, b) ? a : b );

    return editor.exec({
        ranges: [editor.range(minPosition, editor.position(editor.lines.length-1, editor.lines[editor.lines.length-1].length))]
    });
};

export const addCursorDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => [range, editor.range(getCharPositionDown(editor, range.head))]).flat()
    });
};

export const addCursorUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => [range, editor.range(getCharPositionUp(editor, range.head))]).flat()
    });
};

export const addCursorOnSelection = editor => {
    return editor.exec({
        ranges: editor.ranges.filter(range => !range.isEmpty).map(range => {
            return range.getPerLineSelectionRanges().map(line => editor.range(line.line, line.end));
        }).flat()
    });
};

export const removeExtraCursors = editor => {
    const ranges = editor.ranges;
    if(ranges.length <= 1 && ranges[0].isEmpty()){ return false; }

    return editor.exec({
        ranges: [editor.range(editor.ranges[0].head)]
    });
};

export const fontSizeUp = editor => {
    return editor.changeFontSize(1);
};

export const fontSizeDown = editor => {
    return editor.changeFontSize(-1);
};

export const copy = editor => {

};

export const cut = editor => {

};

export const paste = editor => {

};

// const deleteSubwordForward = view => {
//     if(!selectSubwordForward(view)){ return false; }

//     const changes = view.state.selection.ranges;
//     if(!changes.length){ return false; }
    
//     view.dispatch({
//         changes,
//         scrollIntoView: true
//     });

//     return true;
// };

// const deleteSubwordBackward = view => {
//     if(!selectSubwordBackward(view)){ return false; }

//     const changes = view.state.selection.ranges;
//     if(!changes.length){ return false; }
    
//     view.dispatch({
//         changes,
//         scrollIntoView: true
//     });

//     return true;
// };