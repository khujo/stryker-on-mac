const config = require('./data/config.json');
const tree = require('./data/tree.json');

const Iterator = require('../index.js');

const testName = "TestParameter";
const testConcept = "TestConcept";

describe('tests with no value restriction', () => {

  let noConfigIterator = new Iterator();

  test('no parameter', () => {
    expect(noConfigIterator.getNextActions()).toBeUndefined();
  });

  test('ATOMIC', () => {
    let parameter = createStringParameter(["a"]);
    expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["a"]);
  });

  test('SET', () => {
    let parameter = createStringParameter(["4", "6", "9"]);
    expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["4", "6", "9"]);
  });

  describe("RANGE_INTEGER", () => {
    test("range integer", () => {
        let parameter = createRangeIntegerParameter("[-2;2]");
        expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["0", "-2", "-1", "1", "2"]);
    });
    test("range integer with zero as upper bound", () => {
        let parameter = createRangeIntegerParameter("[-2;0]");
        expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["-2", "-1", "0"]);
    });
    test("range integer with zero as lower bound", () => {
        let parameter = createRangeIntegerParameter("[0;2]");
        expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["0", "1", "2"]);
    });
    test("range integer with lower bound = upper bound", () => {
        let parameter = createRangeIntegerParameter("[2;2]");
        expect(noConfigIterator.getNextActions(parameter).map(j => j.value)).toEqual(["2"]);
    });
    test("range integer infinite bounds", () => {
        let parameter = createRangeIntegerParameter("[-inf;inf]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
    test("range integer infinite lower bounds", () => {
        let parameter = createRangeIntegerParameter("[-inf;10]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
    test("range integer infinite upper bounds", () => {
        let parameter = createRangeIntegerParameter("[10;inf]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
  });
  describe("RANGE_DOUBLE", () => {
    let stepSizeIterator = new Iterator({parameters: [{
      name: testName,
      concept: testConcept,
      stepSize: 0.5
    }]});
    test("range double", () => {
        let parameter = createRangeDoubleParameter("[-2.5;2.5]");
        expect(stepSizeIterator.getNextActions(parameter).map(j => j.value)).toEqual(["0", "-2.5", "-2", "-1.5", "-1", "-0.5", "0.5", "1", "1.5", "2", "2.5"]);
    });
    test("range double should always include zero and upper bound", () => {
        let parameter = createRangeDoubleParameter("[-0.25;1.5]");
        expect(stepSizeIterator.getNextActions(parameter).map(j => j.value)).toEqual(["0", "-0.25", "0.25", "0.75", "1.25", "1.5"]);
    });
    test("range double with lower bound = upper bound", () => {
        let parameter = createRangeDoubleParameter("[2.5;2.5]");
        expect(stepSizeIterator.getNextActions(parameter).map(j => j.value)).toEqual(["2.5"]);
    });
    test("range double with no step size should use a stepsize of 1%", () => {
        let parameter = createRangeDoubleParameter("[-50;50]");
        let values = noConfigIterator.getNextActions(parameter).map(j => j.value);
        expect(values).toHaveLength(101);
        for(let i = -50; i <= 50; i++) {
          expect(values).toContain(i.toString());
        }
    });
    test("range double with no step size should use a stepsize of 1% but should always contain zero", () => {
        let parameter = createRangeDoubleParameter("[-49.5;50.5]");
        let values = noConfigIterator.getNextActions(parameter).map(j => j.value);
        expect(values).toHaveLength(102);
        expect(values).toContain("0");
        for(let i = -49.5; i <= 50.5; i++) {
          expect(values).toContain(i.toString());
        }
    });

    test("range double with small range should not be printet in scientific way", () => {
        let parameter = createRangeDoubleParameter("[-1.0;1.0]");
        let values = noConfigIterator.getNextActions(parameter).map(j => j.value);
        expect(values).toHaveLength(101);
        expect(values).toContain("0");
        values.forEach(v => {
          expect(v).not.toEqual(expect.stringContaining('e'));
        });
    });

    test("range double with big range should contain min value", () => {
        let parameter = createRangeDoubleParameter("[-1000005;1000005]");
        let values = noConfigIterator.getNextActions(parameter).map(j => j.value);
        expect(values).toContain("-1000005");
    });

    test("range double infinite bounds", () => {
        let parameter = createRangeIntegerParameter("[-infDouble;infDouble]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
    test("range double infinite lower bounds", () => {
        let parameter = createRangeIntegerParameter("[-infDouble;10]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
    test("range double infinite upper bounds", () => {
        let parameter = createRangeIntegerParameter("[10;infDouble]");
        expect(() => noConfigIterator.getNextActions(parameter).map(j => j.value)).toThrowErrorMatchingSnapshot();
    });
  });

});

test('range double without step size should have 101 elements', () => {
  let parameter = {
    name: "Airbaganzahl",
    values: [
        {
            "valueType": "RANGE_DOUBLE",
            "selectable": true,
            "value": "[4.0;10.0]"
        }
      ],
    concept: "Auto",
    path: []
  };
  let newIterator = new Iterator({
    parameters: [{
      name: "Artikelname",
      concept: "Auto"
    },{
      name: "Airbaganzahl",
      concept: "Auto",
      values: "[7.5;12.5]"
    }]
  });
  expect(newIterator.getNextActions(parameter).map(j => j.value)).toHaveLength(101);
});

test('range double should always include min, max and zero', () => {
  let parameter = {
    name: "Airbaganzahl",
    values: [
        {
            "valueType": "RANGE_DOUBLE",
            "selectable": true,
            "value": "[-10.0;10.0]"
        }
      ],
    concept: "Auto",
    path: []
  };
  let newIterator = new Iterator({
    parameters: [{
      name: "Airbaganzahl",
      concept: "Auto",
      values: "[-9.5;10.0]",
      stepSize: 1.0
    }]
  });
  expect(newIterator.getNextActions(parameter).map(j => j.value)).toEqual(expect.arrayContaining(["-9.5","0","10"]));
});

describe("tests with value restriction", () => {
  describe("SET", () => {
    var setTests = require('./data/Set.json');
    setTests.forEach(t => {
      test(t.name, () => {
        let config = createJobDescription(t);
        let parameter = createStringParameter(t.config);
        let testIterator = new Iterator(config);
        expect(testIterator.getNextActions(parameter).map(j => j.value)).toEqual(t.expected);
      });
    });
  });

  describe("RANGE_INTEGER", () => {
    var rangeItegerTests = require('./data/RangeInteger.json');
    rangeItegerTests.forEach(t => {
      test(t.name, () => {
        let config = createJobDescription(t);
        let parameter = createRangeIntegerParameter(t.config);
        let testIterator = new Iterator(config);
        expect(testIterator.getNextActions(parameter).map(j => j.value)).toEqual(t.expected);
      });
    });
  });

  describe("RANGE_DOUBLE", () => {
    var rangeDoubleTests = require('./data/RangeDouble.json');
    rangeDoubleTests.forEach(t => {
      test(t.name, () => {
        let config = createJobDescription(t);
        let parameter = createRangeDoubleParameter(t.config);
        let testIterator = new Iterator(config);
        expect(testIterator.getNextActions(parameter).map(j => j.value)).toEqual(t.expected);
      });
    });
  });
});

function createJobDescription(test) {
  let jobDescription = {
    parameters: [{
      name: testName,
      concept: testConcept,
      stepSize: test.stepSize,
      values: test.job
    }]
  };
  return jobDescription;
}

function createStringParameter(values) {
  return {
    name: testName,
    concept: testConcept,
    values: values.map(v => {return {selectable: true, value: v, valueType: "STRING"}})
  };
}

function createRangeIntegerParameter(value) {
  return {
    name: testName,
    concept: testConcept,
    values: [{selectable: true, value: value, valueType: "RANGE_INTEGER"}]
  };
}

function createRangeDoubleParameter(value) {
  return {
    name: testName,
    concept: testConcept,
    values: [{selectable: true, value: value, valueType: "RANGE_DOUBLE"}]
  };
}
