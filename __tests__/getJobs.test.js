const Iterator = require('../index.js');
const config = require('./data/config.json');
const tree = require('./data/tree.json');

test('Find first parameter without configuration should find "Airbaganzahl" on "Auto" concept', () => {
  let iterator = new Iterator();
  expect(iterator.getJobs(tree)).toMatchObject([{
    containerPath: [],
    parameterIndex: 0,
    parameterName: "Airbaganzahl",
    value: "4",
    concept: 'Auto'
  },{
    containerPath: [],
    parameterIndex: 0,
    parameterName: "Airbaganzahl",
    value: "6",
    concept: 'Auto'
  },{
    containerPath: [],
    parameterIndex: 0,
    parameterName: "Airbaganzahl",
    value: "9",
    concept: 'Auto'
  }]);
});

test('Find first parameter with configuration should find "Airbaganzahl" on "Auto" concept and restrict values', () => {
  let iterator = new Iterator({parameters: [{
    name: "Airbaganzahl",
    concept: "Auto",
    values: ["4","6"]
  }]});
  expect(iterator.getJobs(tree)).toMatchObject([{
    containerPath: [],
    parameterIndex: 0,
    parameterName: "Airbaganzahl",
    value: "4"
  },{
    containerPath: [],
    parameterIndex: 0,
    parameterName: "Airbaganzahl",
    value: "6"
  }]);
});

test('Find first parameter with value restriction on first parameter that restricts to an empty set should return the next parameter', () => {
  let iterator = new Iterator({parameters: [{
    name: "Airbaganzahl",
    concept: "Auto",
    values: ["10","11"]
  }]});
  expect(() => iterator.getJobs(tree)).toThrowErrorMatchingSnapshot();
  try {
    iterator.getJobs(tree);
  } catch (error) {
    expect(error.parameter).toMatchObject({
      name: "Airbaganzahl",
      concept: "Auto"
    });
    expect(error.valueRestriction).toEqual(["10","11"]);
  }
});

test('First parameter should be terminal', () => {
  let iterator = new Iterator({parameters: [{
    name: "Artikelname",
    concept: "Auto"
  },{
    name: "Airbaganzahl",
    concept: "Auto",
    values: ["10","11"]
  }]});
  tree.rootContainer.parameters[1].terminal = true;
  expect(() => iterator.getJobs(tree)).toThrowErrorMatchingSnapshot();
  try {
    iterator.getJobs(tree);
  } catch (error) {
    expect(error.parameter).toMatchObject({
      name: "Airbaganzahl",
      concept: "Auto"
    });
    expect(error.valueRestriction).toEqual(["10","11"]);
  }
});
