export default class Position{
    static lessThan(p1, p2){
        return p1.line < p2.line || (p1.line===p2.line && p1.col<p2.col);
    };
    
    static lessEqualThan(p1, p2){
        return p1.line < p2.line || (p1.line===p2.line && p1.col<=p2.col);
    };
    
    static greaterThan(p1, p2){
        return p1.line > p2.line || (p1.line===p2.line && p1.col>p2.col);
    };

    static greaterEqualThan(p1, p2){
        return p1.line > p2.line || (p1.line===p2.line && p1.col>=p2.col);
    };
    
    static equals(p1, p2){
        return p1.line===p2.line && p1.col===p2.col;
    };

    constructor(editor, line, col=0){
        this._editor = editor;
        this.line = Math.max(line, 0);
        this.col = Math.max(col, 0);
    };

    copy(){
        return new Position(this._editor, this.line, this.col);
    };

    getDocPosition(){
        return this._editor.lines[this.line].getDocPosition() + this.col;
    };

    shiftDocPosition(documentPositionDelta){
        return this.setDocPosition(this.getDocPosition() + documentPositionDelta);
    };

    setDocPosition(newDocumentPosition){
        let newLine = this.line;
        let newLinePosition;
        while(this._editor.lines[newLine]){
            newLinePosition = this._editor.lines[newLine].getDocPosition();
            if(newDocumentPosition < newLinePosition){ newLine -= 1; }
            else if(newDocumentPosition > newLinePosition+this._editor.lines[newLine].length){ newLine += 1; }
            else{ break; }
        }
        if(!this._editor.lines[newLine]){ return new Position(this._editor, 0, 0); }

        return new Position(this._editor, newLine, newDocumentPosition-newLinePosition);
    };
};