# yaml-edit
Module for editing YAML

## Use 

### Initializing 

The yaml editor can be initialized by passing the yaml (string) as a parameter to the require function.

    let yamlEdit = require('yaml-edit')(myYamlText)

Alternatively, the editor can be initialized with the `init(string text)` method

    let yamlEdit = require('yaml-edit)();
    yamlEdit.init(myYamlText);

### Inserting into YAML 
    
Snippets can be added to the YAML with the `insertChild(string target, object doc)`method. For example:

    yamlEdit.init(myInitialYaml);
    yamlEdit.insertChild('functions', {
        hello: {
            handler: 'index.handler'
        }        
    })

Target can also be a deeper in the hierarchy, e.g.

    yamlEdit.insertChild('functions.hello', {
        events: [
            { foo : bar}
        ]
    })

If the insert is successful, `insertChild()` returns `null`, otherwise (e.g. if the target location cannot be found), 
it returns an Error

### Checking whether a key already exists

Existance of a key can be checked with the `hasKey(string target)` method. Returns true if the key is found, false otherwise.

### Getting the resulting YAML string

The resulting YAML can be returned using the `dump()` method. E.g.

    let output = yamlEdit.dump();
    
## Development

Please run module tests in a Node 4 environment prior to submitting PRs using 

    npm run test

Add tests for any additional cases you implement into `test/yaml-edit.test.js`

## Release History

* 2016/10/21 - v0.1.0 Initial version

## License

Licensed for users and contributors under MIT license.
https://github.com/mpuittinen/yaml-edit/blob/master/LICENSE


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/SC5/lambda-wrapper/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
