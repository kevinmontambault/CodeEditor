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

    constructor(line, col=0){
        this.line = Math.max(line, 0);
        this.col = Math.max(col, 0);
    };
};