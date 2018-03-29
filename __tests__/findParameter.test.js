var config = require('./data/config.json');
var tree = require('./data/tree.json');

var Iterator = require('../index.js');

let iterator = new Iterator(config);

test('no configuration', () => {
  let noConfigIterator = new Iterator();
  expect(noConfigIterator.findNextParameter(tree.rootContainer)).toMatchObject({
    name: "Airbaganzahl",
    concept: "Auto",
    path: [],
    index: 0
  });
});

test('simple configuration iterator', () => {
  expect(iterator.findNextParameter(tree.rootContainer)).toMatchObject({
    name: "Artikelname",
    concept: "Auto",
    path: [],
    index: 1
  });
});

test('first parameter is terminal', () => {
  tree.rootContainer.parameters[1].terminal = true;
  expect(iterator.findNextParameter(tree.rootContainer)).toMatchObject({
    name: "Artikelname",
    concept: "Motor",
    path: [0],
    index: 0
  });
});

test('get parameters as list', () => {
  expect(iterator._getParameters(tree.rootContainer, []).length).toBe(55);
});

test('first parameter has inf value', () => {
  let infValueTree = require('./data/infValue.json');
  let restrictedIterator = new Iterator({parameters: [{
    name: "Artikelname",
    concept: "Auto",
    stepSize: 1
  },{
    name: "Artikelname",
    concept: "Motor"
  },
]});
  expect(restrictedIterator.findNextParameter(infValueTree.rootContainer)).toMatchObject({
    name: "Artikelname",
    concept: "Motor"
  });
});

test('first parameter has inf value but finite value restriction', () => {
  let infValueTree = require('./data/infValue.json');
  let restrictedIterator = new Iterator({parameters: [{
    name: "Artikelname",
    concept: "Auto",
    values: "[0;10]"
  }]});
  expect(iterator.findNextParameter(infValueTree.rootContainer)).toMatchObject({
    name: "Artikelname",
    concept: "Auto"
  });
});

test('all parameters terminal', ()=> {
  _setAllParametersTrue(tree.rootContainer);
  expect(iterator.findNextParameter(tree.rootContainer)).toBeUndefined();
});

test('all parameters terminal no config', ()=> {
  _setAllParametersTrue(tree.rootContainer);
  expect(new Iterator().findNextParameter(tree.rootContainer)).toBeUndefined();
});

test('skip parameter with anystring value', ()=> {
  let container = {
    properties: {
      "SimpleNodeModel.Concept": "Concept"
    },
    parameters: [{
      name: "ParameterWithAnyString",
      values: [],
      terminal: false
    },{
      name: "ParameterWithValue",
      values: [{
        value: "1",
        selectable: true,
        valueType: "STRING"
      }],
      terminal: false
    }],
    children: []
  };
  expect(new Iterator().findNextParameter(container)).toMatchObject({
    name: "ParameterWithValue"
  });
});

test('dont skip parameter with string value inf', ()=> {
  let container = {
    properties: {
      "SimpleNodeModel.Concept": "Concept"
    },
    parameters: [{
      name: "ParameterWithValueContainingInf",
      values: [{
        value: "inf",
        selectable: true,
        valueType: "STRING"
      },{
        value: "secondValue",
        selectable: true,
        valueType: "STRING"
      }],
      terminal: false
    },{
      name: "ParameterWithValue",
      values: [{
        value: "1",
        selectable: true,
        valueType: "STRING"
      }],
      terminal: false
    }],
    children: []
  };
  expect(new Iterator().findNextParameter(container)).toMatchObject({
    name: "ParameterWithValueContainingInf"
  });
});

function _setAllParametersTrue(container) {
  container.parameters.forEach(p => {p.terminal = true;});
  container.children.forEach(_setAllParametersTrue);
}
