# lambda-wrapper

[![Build Status](https://travis-ci.org/nordcloud/lambda-wrapper.svg?branch=master)](https://travis-ci.org/nordcloud/lambda-wrapper)

Wrapper for running lambda modules locally or from AWS during development

## Use 

### Initializing the local Lambda

    // Loads the module in myModule/mymod.js
    var lambdaFunc = require('myModule/mymod.js');
    var lambda = require('lambda-wrapper').wrap(lambdaFunc);

### Initializing a lambda in AWS
    
    var lambda = require('lambda-wrapper').wrap({
        region: 'eu-west-1',
        lambdaFunction: 'myFunctionName'
    });

### Running the function in the Lambda module

    var event = { key1: 'val1', key2: val2 };
    lambda.run(event, function(err, data) {
        if (err) {
            ... handle error
        }
        ... process data returned by the Lambda function
    })

If you want to pass a custom context to the Lambda module (only when running local), use the runHandler method. e.g.
    
    lambda.runHandler(event, customContext, callback)

Documentation for valid propreties in the Lambda context object are documented here http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html

Exceptions from within the module will be returned as errors via the callback / promise.
 
## Development

Please run module tests in a Node 4 environment prior to submitting PRs using 

    npm run test

Live lambda run test requires that the function in lambdaWrapper-test.js is deployed 
to your AWS account as 'lambdaWrapper-test'. 

## Release History

* 2018/05/07 - v0.3.0 - Support for async calls, improved input validation 
* 2017/07/09 - v0.2.0 - Return exceptions as errors via callback
* 2017/06/16 - v0.1.3 - Allow context object in run
* 2016/10/21 - v0.1.2 - Support for using promises
* 2016/07/26 - v0.1.1 - Support for alternative handler. runHandler method for passing custom context.
* 2016/04/26 - v0.1.0 - Support for running lambda functions also from AWS
* 2016/04/26 - v0.0.6 - Support for NodeJS 4.3 runtime (and callback notation)
* 2015/09/01 - v0.0.2 - Pass module object rather than path to init().
                        Removed automatic loading of module.
* 2015/07/23 - v0.0.1 - Initial version of module

## License

Copyright (c) 2016 [Nordcloud](https://nordcloud.com/), licensed for users and contributors under MIT license.
https://github.com/nordcloud/lambda-wrapper/blob/master/LICENSE
