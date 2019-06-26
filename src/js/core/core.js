import { State        } from './application/state.js';
import { updates      } from './application/updates.js';
import { transitions  } from './application/transitions.js';

const core = {
  init() {
    this.state = State.create();
    this.periphery = [];
    return this;
  },

  compute(input) {
    this.state.input = input;

    const transition = transitions.get(this.state, input);

    if (transition) {
      this.state.update = transition.do;
      this.state.label  = transition.to;

      const update = updates[transition.do];
      update && update.bind(updates)(this.state, input);

      this.publish();
    }
  },

  attach(name, func) {
    this.periphery[name] = func;
  },

  publish() {
    for (let key of Object.keys(this.periphery)) {
      this.periphery[key](this.state.export());
    }
  },

  kickoff() {
    this.compute({ type: 'go' });
  },
};

export { core };
