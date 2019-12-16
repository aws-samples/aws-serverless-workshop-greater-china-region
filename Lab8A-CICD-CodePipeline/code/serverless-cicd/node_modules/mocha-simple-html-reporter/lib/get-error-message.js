'use strict';

module.exports = (err) => {
    const message = err.toString();
    
    if (message === '[object Error]') {
        return err.message;
    }

    return message;
};
