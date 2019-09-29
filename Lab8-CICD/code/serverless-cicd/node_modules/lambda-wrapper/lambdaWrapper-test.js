// Test function. Save as lambdaWrapper-test to your AWS env

'use strict';

exports.handler = (event, context, callback) => {
  callback(null, {
    src: 'lambda',
    event
  });
};
