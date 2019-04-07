import { State        } from './application/state.js';
import { actions      } from './application/actions.js';
import { transitions  } from './application/transitions.js';

const core = {
  init() {
    this.state = State.create();
    this.periphery = [];
    return this;
  },

  attach(name, func) {
    this.periphery[name] = func;
  },

  kickoff() {
    this.publish();
    this.compute({ type: 'go' });
  },

  compute(input) {
    const transition = transitions.get(this.state, input);
    // console.log('from: ', this.state.id, input, transition); // DEBUG
    if (transition) {
      this.makeTransition(input, transition);
      this.publish();
    }
  },

  // TODO: I think we don't need this anymore.
  // (does not seem like it's used anywhere)
  get stateData() {
    return JSON.parse(JSON.stringify(this.state));
  },

  // this is the output of the machine. It could be called `output` perhaps?
  // this whole `this.periphery[keys]` thing is a bit hard to understand.

  // TODO: can't we just turn the periphery into an array of functions that need
  // to be called?
  publish() {
    const keys = Object.keys(this.periphery);
    for (let key of keys) {
      this.periphery[key](this.state.export());
    }
  },

  // TODO: not functional right now (this method is injected into "hist")
  // (API has also changed quite a bit)
  setState(stateData) {
    this.state = stateData;
    this.state.doc = doc.init(stateData.doc);
    this.periphery['ui'] &&
      this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
    // ^ only UI is synced
    // ^ TODO: call sync here, and make that method more flexible
  },

  makeTransition(input, transition) {
    this.state.currentInput = input.type;
    this.state.id = transition.to;

    const action = actions[transition.do];
    action && action.bind(actions)(this.state, input);
  },
};

export { core };
