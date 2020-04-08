'use strict';

const AWS = require('aws-sdk');

// Wrapper class for AWS Lambda
class Wrapped {
  constructor(mod, opts) {
    const options = opts || {};

    this.lambdaModule = mod;
    const handler = options.handler || 'handler';

    if (mod[handler]) {
      this.handler = mod[handler];
    } else {
      if (!this.lambdaModule.lambdaFunction) {
        throw new Error("Invalid input. Expected either lambda module (with exposed handler) " +
          "or AWS Lambda configuration (with provided 'lambdaFunction' name)");
      }
    }
  }

  runHandler(event, customContext, cb) {
    return new Promise((resolve, reject) => {

      const promiseCallback = (error, response) => {
        if(error) {
          return reject(error);
        }
        return resolve(response);
      };

      const callback = cb || promiseCallback;

      const defaultContext = {
        succeed: success => callback(null, success),
        fail: error => callback(error, null),
        done: (error, success) => callback(error, success)
      };

      const lambdaContext = Object.assign({}, defaultContext, customContext);

      try {
        if (this.handler) { 
          const handlerResult = this.handler(event, lambdaContext, callback);
          // Check if the result itself is a promise
          if (handlerResult && handlerResult.then) {
            handlerResult.then(function(data) {
              // Avoid Maximum call stack size exceeded exceptions
              return setImmediate(function() {
                callback(null, data);
              });
            }).catch(function(err) {
               // Avoid Maximum call stack size exceeded exceptions
               return setImmediate(function() {
                callback(err);
              });
            });
          }
        } else {
          if (this.lambdaModule.region) {
            AWS.config.update({
              region: this.lambdaModule.region
            });
          }

          const lambda = new AWS.Lambda();
          const params = {
            FunctionName: this.lambdaModule.lambdaFunction,
            InvocationType: 'RequestResponse',
            LogType: 'None',
            Payload: JSON.stringify(event)
          };

          lambda.invoke(params, (err, data) => {
            if (err) {
              return callback(err);
            }
            if (data.FunctionError) {
              return callback(Object.assign(new Error(JSON.parse(data.Payload).errorMessage), data));
            }
            return callback(null, JSON.parse(data.Payload));
          });
        }
      } catch (ex) {
        return callback(ex);
      }
    });
  }

  run(event, context, callback) {
    let callbackFunction = callback;
    let contextObject = context;
    if (typeof context === 'function') {
      // backwards compability
      callbackFunction = context;
      contextObject = {};
    }
    return this.runHandler(event, contextObject, callbackFunction);
  }
}

// Wrapper factory

const wrap = (mod, options) => new Wrapped(mod, options);

// Static variables (for backwards compatibility)

let latest;

// Public interface for the module

module.exports = exports = {

  // reusable wrap method
  wrap,

  // static init/run interface for backwards compatibility
  init: (mod, options) => {
    latest = wrap(mod, options);
  },
  run: (event, context, callback) => new Promise((resolve, reject) => {
    let callbackFunction = callback;
    let contextObject = context;
    if (typeof context === 'function') {
      // backwards compability
      callbackFunction = context;
      contextObject = {};
    }
    if (typeof latest === typeof undefined) {
      const error = 'Module not initialized';
      reject(error);
      return callbackFunction(error, null);
    }
    return latest.run(event, contextObject, (err, data) => {
      if (callbackFunction) {
        return callbackFunction(err, data);
      }
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  })
};
