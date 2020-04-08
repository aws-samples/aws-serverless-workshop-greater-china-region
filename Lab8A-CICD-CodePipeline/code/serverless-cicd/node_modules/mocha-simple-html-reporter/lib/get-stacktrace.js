'use strict';

module.exports = (err) => {
    if (err.stack) {
        const indexOfMessage = err.stack.indexOf(err.message);
        
        return indexOfMessage === -1
            ? err.stack
            : err.stack.substr(err.message.length + indexOfMessage);
    } else if (err.sourceURL && err.line !== undefined) {
        return '\n(' + err.sourceURL + ':' + err.line + ')';
    }
      
    return '';
}