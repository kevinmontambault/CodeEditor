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
    }else{ return new Position(position.line, position.col-1); }
};

const getCharPositionRight = (editor, position) => {
    if(position.col >= editor.lines[position.line].length){
        if(position.line === editor.lines.length-1){ return new Position(position.line, position.col); }
        else{ return new Position(position.line+1, 0); }
    }else{ return new Position(position.line, position.col+1); }
};

export const deleteSelectionForward = editor => {
    const normalizedRanges = editor.ranges.map(range => range.normal());

    return editor.exec({
        delete: normalizedRanges,
        ranges: normalizedRanges.map(range => new SelectionRange(range.head, range.tail))
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
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionLeft(editor, range.head)))
    });
};

export const cursorMoveRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionRight(editor, range.head)))
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

export const selectCharRight = editor => {
    return editor.exec({
        ranges: editor.ranges.map(range => new SelectionRange(getCharPositionRight(editor, range.head), range.tail))
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

// const addCursorUp = ({state, dispatch}) => {
//     const mainIndex = state.selection.mainIndex;
//     const ranges = [...state.selection.ranges];
//     const mainPosition = ranges[state.selection.mainIndex].head;
//     const mainLine = state.doc.lineAt(mainPosition);
//     const mainCol = mainPosition - mainLine.from;

//     for(const range of state.selection.ranges){
//         const line = state.doc.lineAt(range.head);
//         if(line.number === 1){ continue; }

//         const nextLine = state.doc.line(line.number - 1);
//         const newHead = Math.min(nextLine.from+mainCol, nextLine.to);
//         ranges.push(EditorSelection.range(newHead, newHead));
//     }

//     dispatch({selection:EditorSelection.create(ranges, mainIndex)});
//     return true;
// };

// const addCursorDown = ({state, dispatch}) => {
//     const mainIndex = state.selection.mainIndex;
//     const ranges = [...state.selection.ranges];
//     const mainPosition = ranges[state.selection.mainIndex].head;
//     const mainLine = state.doc.lineAt(mainPosition);
//     const mainCol = mainPosition - mainLine.from;

//     for(const range of state.selection.ranges){
//         const line = state.doc.lineAt(range.head);
//         if(state.doc.lines === line.number){ continue; }

//         const nextLine = state.doc.line(line.number + 1);
//         const newHead = Math.min(nextLine.from+mainCol, nextLine.to);
//         ranges.push(EditorSelection.range(newHead, newHead));
//     }

//     dispatch({selection:EditorSelection.create(ranges, mainIndex)});
//     return true;
// };