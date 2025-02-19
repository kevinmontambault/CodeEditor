import SelectionRange from './SelectionRange.js';
import Position from './Position.js';

const getCharPositionUp = (editor, position) => {
    if(position.line <= 0){ return new Position(position.line, 0); }
    else{ return new Position(position.line-1, position.col); }
};

const getCharPositionDown = (editor, position) => {
    if(position.line >= editor.lines.length-1){ return new Position(position.line, editor.lines[position.line].length); }
    else{ return new Position(position.line+1, position.col); }
};

const getCharPositionLeft = (editor, position) => {
    if(position.col <= 0){
        if(position.line === 0){ return new Position(0, 0); }
        else{ return new Position(position.line-1, editor.lines[position.line-1].length); }
    }else{ return new Position(position.line, Math.min(editor.lines[position.line].length, position.col)-1); }
};

const getCharPositionRight = (editor, position) => {
    if(position.col >= editor.lines[position.line].length){
        if(position.line === editor.lines.length-1){ return new Position(position.line, position.col); }
        else{ return new Position(position.line+1, 0); }
    }else{ return new Position(position.line, Math.min(editor.lines[position.line].length, position.col)+1); }
};

const getWordPositionLeft = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length) - 1;

    if(initialCol === 0){ return new Position(position.line, 0); }
    if(initialCol === -1){ return getCharPositionLeft(editor, position); }

    let initialChar;
    while(initialCol && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol -= 1; }
    if(initialChar === 0){ return new Position(position.line, 0); }

    let col = initialCol;
    if(/[a-zA-Z0-9_-]/.test(initialChar)){
        while(col && /[a-zA-Z0-9_-]/.test(lineText.charAt(col-1))){ col -= 1; }
    }else{
        while(col && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col-1))){ col -= 1; }
    }

    return new Position(position.line, col);
};

const getWordPositionRight = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length);

    if(initialCol === lineText.length-1){ return new Position(position.line, lineText.length); }
    if(initialCol === lineText.length){ return getCharPositionRight(editor, position); }

    let initialChar;
    while(initialCol<lineText.length && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol += 1; }
    if(initialCol === lineText.length){ return new Position(position.line, lineText.length); }

    let col = initialCol;
    if(/[a-zA-Z0-9_-]/.test(initialChar)){
        while(col<lineText.length && /[a-zA-Z0-9_-]/.test(lineText.charAt(col))){ col += 1; }
    }else{
        while(col<lineText.length && /[^a-zA-Z0-9_-]/.test(lineText.charAt(col))){ col += 1; }
    }

    return new Position(position.line, col);
};

const getSubwordPositionLeft = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length) - 1;

    if(initialCol === 0){ return new Position(position.line, 0); }
    if(initialCol === -1){ return getCharPositionLeft(editor, position); }

    let initialChar;
    while(initialCol && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol -= 1; }
    if(initialChar === 0){ return new Position(position.line, 0); }

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

    return new Position(position.line, col);
};

const getSubwordPositionRight = (editor, position) => {
    const lineText = editor.lines[position.line].text;
    let initialCol = Math.min(position.col, lineText.length);

    if(initialCol === lineText.length-1){ return new Position(position.line, lineText.length); }
    if(initialCol === lineText.length){ return getCharPositionRight(editor, position); }

    let initialChar;
    while(initialCol<lineText.length && /\s/.test(initialChar = lineText.charAt(initialCol))){ initialCol += 1; }
    if(initialCol === lineText.length){ return new Position(position.line, lineText.length); }

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

    return new Position(position.line, col);
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

export const deleteSelectionForward = editor => {
    const normalizedRanges = editor.ranges.map(range => range.normal());
    const deleteRanges = normalizedRanges.map(range => {
        if(!range.empty){ return range; }
        return new SelectionRange(getCharPositionRight(editor, range.head), range.tail);
    });

    return editor.exec({
        delete: deleteRanges,
        ranges: deleteRanges.map(range => new SelectionRange(range.tail, range.tail))
    });
};

export const deleteSelectionBackward = editor => {

};

export const insertCharacter = character => editor => {
    // return editor.exec({
    //     insert: editor.ranges.map(range => ({line:range.head.line, col:range.head.col, string:character})),
    //     delete: 0,
    //     ranges: editor.ranges.map(range => {
    //         new SelectionRange({line:range.head.line-1, });
    //     })
    // });
};

export const cursorMoveUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionUp(editor, range.head)))
    });
};

export const cursorMoveDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionDown(editor, range.head)))
    });
};

export const cursorMoveLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => {
            if(range.empty){ return new SelectionRange(getCharPositionLeft(editor, range.head)); }
            return new SelectionRange(range.min());
        })
    });
};

export const cursorWordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getWordPositionLeft(editor, range.head)))
    });
};

export const cursorSubwordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getSubwordPositionLeft(editor, range.head)))
    });
};

export const cursorLineLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(new Position(range.head.line, 0)))
    });
};

export const cursorDocStart = editor => {
    return editor.exec({
        ranges: [new SelectionRange(new Position(0, 0))]
    });
};

export const cursorMoveRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => {
            if(range.empty){ return new SelectionRange(getCharPositionRight(editor, range.head)); }
            return new SelectionRange(range.max());
        })
    });
};

export const cursorWordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getWordPositionRight(editor, range.head)))
    });
};

export const cursorSubwordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getSubwordPositionRight(editor, range.head)))
    });
};

export const cursorLineRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(new Position(range.head.line, editor.lines[range.head.line].length)))
    });
};

export const cursorDocEnd = editor => {
    return editor.exec({
        ranges: [new SelectionRange(new Position(editor.lines.length-1, editor.lines[editor.lines.length-1].length))]
    });
};

export const selectLineUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionUp(editor, range.head), range.tail))
    });
};

export const selectLineDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionDown(editor, range.head), range.tail))
    });
};

export const selectCharLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionLeft(editor, range.head), range.tail))
    });
};

export const selectWordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getWordPositionLeft(editor, range.head), range.tail))
    });
};

export const selectSubwordLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getSubwordPositionLeft(editor, range.head), range.tail))
    });
};

export const selectLineLeft = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(new Position(range.head.line, 0), range.tail))
    });
};

export const selectDocStart = editor => {
    const maxPosition = editor.ranges.map(range => range.max()).reduce((a, b) => Position.lessThan(a, b) ? a : b );

    return editor.exec({
        ranges: [new SelectionRange(new Position(0, 0), maxPosition)]
    });
};

export const selectAll = editor => {
    return editor.exec({
        ranges: [new SelectionRange(new Position(editor.lines.length-1, editor.lines[editor.lines.length-1].length), new Position(0, 0))]
    });
};

export const selectCharRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionRight(editor, range.head), range.tail))
    });
};

export const selectWordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getWordPositionRight(editor, range.head), range.tail))
    });
};

export const selectSubwordRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getSubwordPositionRight(editor, range.head), range.tail))
    });
};

export const selectLineRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(new Position(range.head.line, editor.lines[range.head.line].length), range.tail))
    });
};

export const selectDocEnd = editor => {
    const minPosition = editor.ranges.map(range => range.min()).reduce((a, b) => Position.lessThan(a, b) ? a : b );

    return editor.exec({
        ranges: [new SelectionRange(new Position(editor.lines.length-1, editor.lines[editor.lines.length-1].length), minPosition)]
    });
};

export const addCursorDown = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => [range, new SelectionRange(getCharPositionDown(editor, range.head))]).flat()
    });
};

export const addCursorUp = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => [range, new SelectionRange(getCharPositionUp(editor, range.head))]).flat()
    });
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