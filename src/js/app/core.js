import { State } from './core/_.js';
import { updates } from './core/_.js';
import { transitions } from './core/_.js';

const core = {
  init(canvasWidth) {
    this.state = State.create(canvasWidth);
    this.modules = [];

    return this;
  },

  attach(name, func) {
    this.modules[name] = func;
  },

  compute(input) {
    this.state.input = input;

    console.log(input);
    console.log(transitions.get(this.state, input)); // undefined

    const transition = transitions.get(this.state, input);

    if (transition) {
      this.state.update = transition.do; // a string
      this.state.mode = transition.to.mode;
      this.state.label = transition.to.label;

      const update = updates[transition.do]; // a function, or undefined
      update && update(this.state, input);

      console.log(this.state.description);
      this.publish();
    }
  },

  publish() {
    for (let key of Object.keys(this.modules)) {
      this.modules[key](this.state.description);
    }

    this.state.snapshots = {};
  },

  kickoff() {
    this.compute({ type: 'go' });
  },
};

export { core };
