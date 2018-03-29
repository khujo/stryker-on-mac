class Iterator {

  constructor(config) {
    this.config = config;
  }

  getJobs(configuration){
    let parameter = this.findNextParameter(configuration.rootContainer);
    let nextActions = this.getNextActions(parameter);
    if(parameter && (!nextActions || nextActions.length === 0)) {
      throw new Iterator.Exception(parameter,
        this.config && this.config.parameters.find(p => p.name === parameter.name && p.concept === parameter.concept).values);
    } else {
      return nextActions;
    }
  }

  getNextActions(parameter) {
    let jobs = [];
    if(parameter) {
      let confParameter = this.config && this.config.parameters.find(p => p.name === parameter.name && p.concept === parameter.concept);
      let isValueSuitable = this._isValueSuitable.bind(this, confParameter);
      parameter.values.filter(v => v.selectable).forEach(v => {
        if(v.valueType === "RANGE_INTEGER" || v.valueType === "RANGE_DOUBLE") {
          try {
            this._getRangeValues(v, confParameter).forEach(j => {
              jobs.push(this._newJob(parameter, j.toString()));
            });
          } catch (error) {
            if(error instanceof Iterator.Exception) {
              throw new Iterator.Exception(parameter, confParameter && confParameter.values);
            } else {
              throw error;
            }
          }
        } else if(isValueSuitable(v.value)) {
          jobs.push(this._newJob(parameter, v.value));
        }
      });
      return jobs;
    }
  }

  _getRangeValues(value, confParameter) {
    let [min, max] = this._getMinMax(value.value);
    if(isNaN(min) || isNaN(max)) {
      throw new Iterator.Exception();
    }
    let valueRestriction = confParameter && confParameter.values;
    if(valueRestriction && this._isRange(valueRestriction)) {
      let [confMin, confMax] = this._getMinMax(confParameter.values);
      min = Math.max(min, confMin);
      max = Math.min(max, confMax);
      if(value.valueType === "RANGE_INTEGER") {
        min = Math.ceil(min);
        max = Math.floor(max);
      }
    } else if(valueRestriction && Array.isArray(valueRestriction)) {
      return valueRestriction.filter(this._isInRange.bind(this, value.value));
    } else if(valueRestriction) {
      return [valueRestriction].filter(this._isValueSuitable.bind(this, {values: value.value}));
    }

    let stepSize = 1;
    if(value.valueType === "RANGE_DOUBLE") {
      stepSize = this._getStepSize(confParameter, min, max);
    }
    let values = new Set(this._generateDoubleValues(min, max, stepSize));
    return [...values].filter(this._isValueSuitable.bind(this, confParameter));
  }

  _getStepSize(confParameter, min, max) {
    if(confParameter && confParameter.stepSize) {
      return confParameter.stepSize;
    } else {
      return this._getRoundedNumber((max-min)/100);
    }
  }

  * _generateDoubleValues(min, max, stepSize) {
    let i = min;
    if(min < 0.0 && max > 0.0) {
      yield new Number(0.0).toString();
    }
    while(i < max) {
      yield i.toString();
      i=this._getRoundedNumber(i+stepSize);
    }
    yield max.toString();
  }

  _getRoundedNumber(number) {
    return new Number(number.toPrecision(5));
  }

  _newJob(parameter, value) {
    return {
      containerPath: parameter.path,
      parameterIndex: parameter.index,
      parameterName: parameter.name,
      concept: parameter.concept,
      value: value
    };
  }

  _isValueSuitable(confParameter, value) {
    if(confParameter && confParameter.values) {
      if(this._isRange(confParameter.values)) {
        return this._isInRange(confParameter.values, value);
      } else {
        return (confParameter.values && confParameter.values.includes(value+"") || value == confParameter.values);
      }
    } else {
      return true;
    }
  }

  _getMinMax(range) {
    return range.substring(1, range.length-1).split(';').map(n => new Number(n));
  }

  _isInRange(range, value) {
    let [min, max] = this._getMinMax(range);
    value = new Number(value);
    return value >= min && value <= max;
  }

  _isRange(value) {
    return typeof value === 'string' && value.startsWith('[') && value.endsWith(']') && value.includes(';');
  }

  _getParameters(container, path) {
    let parameters = container.parameters.map(
      (p, i) => {
        p.concept = container.properties['SimpleNodeModel.Concept'];
        p.path = path;
        p.index = i;
        return p;
      });
    for(let i = 0; i < container.children.length; i++) {
      let newPath = path.slice();
      newPath.push(i);
      parameters = parameters.concat(this._getParameters(container.children[i], newPath));
    }
    return parameters;
  }

  _parameterEqualsAndNotTerminal(p1, p2) {
    return p1.name === p2.name && p1.concept === p2.concept && !p1.terminal;
  }

  _parameterHasFiniteValue(p) {
    let infValue = p.values.find(v => v.selectable && v.valueType.includes("RANGE") && v.value.includes("inf"));
    return infValue === undefined && p.values.length > 0;
  }

  findNextParameter(container) {
    let parameters = this._getParameters(container, []);
    if(this.config) {
      for(let i = 0; i < this.config.parameters.length; i++) {
        let parameter = parameters.find(p => this._parameterEqualsAndNotTerminal(p, this.config.parameters[i]) && (this.config.parameters[i].values || this._parameterHasFiniteValue(p)));
        if(parameter) {
          return parameter;
        }
      }
    } else {
      let parameter = parameters.find(p => !p.terminal && this._parameterHasFiniteValue(p));
      if(parameter) {
        parameter.concept = container.properties['SimpleNodeModel.Concept'];
        return parameter;
      }
    }
  }

}

Iterator.Exception = class extends Error {
    constructor(parameter, valueRestriction) {
      if(parameter && valueRestriction) {
        super(`Error finding jobs for parameter "${parameter.name}" on concept "${parameter.concept}". Current values "${parameter.values.filter(v => v.selectable).map(v => v.value)}" have no intersection with value restriction "${valueRestriction}"!`);
      } else if(parameter) {
        super(`Error finding jobs for parameter "${parameter.name}" on concept "${parameter.concept}" with current values "${parameter.values.filter(v => v.selectable).map(v => v.value)}".`);
      } else {
        super();
      }
      this.parameter = parameter;
      this.valueRestriction = valueRestriction;
    }
}

module.exports = Iterator;
