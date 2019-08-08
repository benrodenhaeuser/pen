import { State } from './core/_.js';
import { updates } from './core/_.js';
import { transitions } from './core/_.js';

const core = {
  init() {
    this.state = State.create();
    this.modules = [];

    return this;
  },

  attach(name, func) {
    this.modules[name] = func;
  },

  compute(input) {
    this.state.input = input;

    const transition = transitions.get(this.state, input);

    if (transition) {
      this.state.update = transition.do; // a string
      this.state.label = transition.to;

      const update = updates[transition.do]; // a function, or undefined
      update && update(this.state, input);

      this.publish();
    }
  },

  publish() {
    // console.log(this.state);

    for (let key of Object.keys(this.modules)) {
      this.modules[key](this.state.snapshot);
    }
  },

  kickoff() {
    this.compute({ type: 'go' });
  },
};

export { core };
