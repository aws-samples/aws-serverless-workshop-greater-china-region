'use strict';

// tests for yaml-edit

const yamlEdit = require('../index.js')();
const expect = require('chai').expect;
const sampleYaml = `# Test yaml file

service: testing

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get

# Some comment here

plugins:
  - my-plugin
`;

describe('Yaml-edit', () => {
  it('dump()', (done) => {
    const yamlEdit1 = require('../index.js')(sampleYaml);
    const out1 = yamlEdit1.dump();
    expect(out1).to.equal(sampleYaml);
    done();
  });

  it('init() + dump()', (done) => {
    yamlEdit.init(sampleYaml + '#TESTING2');
    const out2 = yamlEdit.dump();
    expect(out2).to.equal(sampleYaml + '#TESTING2');
    done();
  });

  it('insertChild (1st level)', (done) => {
    yamlEdit.init(sampleYaml);
    const ret = yamlEdit.insertChild('functions', {
      other: {
        handler: 'other.handler',
        events: [
          {'http': {
            'path': 'other',
            'method': 'get'
          }},
          {'sns': 'mySnsTopic'}
        ]
      }
    });
    expect(ret).to.be.equal(null);
    const out3 = yamlEdit.dump();
    expect(out3).to.be.equal(`# Test yaml file

service: testing

functions:
  other:
    handler: other.handler
    events:
      - http:
          path: other
          method: get
      - sns: mySnsTopic
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get

# Some comment here

plugins:
  - my-plugin
`);
    done();
  });

  it('hasKey() returns true for existing key', (done) => {
    yamlEdit.init(sampleYaml);
    expect(yamlEdit.hasKey('functions.hello')).to.be.equal(true);
    done();
  });

  it('hasKey() returns false for non-existing key', (done) => {
    yamlEdit.init(sampleYaml);
    expect(yamlEdit.hasKey('functions.non-existing')).to.be.equal(false);
    done();
  });

  it('insertChild (deeper level)', (done) => {
    yamlEdit.init(sampleYaml);
    const ret = yamlEdit.insertChild('functions.hello', {
      timeout: 60
    });
    expect(ret).to.be.equal(null);
    const out3 = yamlEdit.dump();
    expect(out3).to.be.equal(`# Test yaml file

service: testing

functions:
  hello:
    timeout: 60
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get

# Some comment here

plugins:
  - my-plugin
`);
    done();
  });

  it('Give error if target place is not found', (done) => {
    yamlEdit.init(sampleYaml);
    const ret = yamlEdit.insertChild('non-existent', {
      foo:'bar'
    });
    expect(ret).to.match(/Error/);
    done();
  })
});
