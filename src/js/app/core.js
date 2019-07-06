import { State        } from './core/application.js';
import { updates      } from './core/application.js';
import { transitions  } from './core/application.js';

const core = {
  init() {
    updates.init();

    this.state   = State.create();
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
      this.state.update = transition.do;
      this.state.label  = transition.to;

      const update = updates[transition.do];

      if (update) {
        update.bind(updates)(this.state, input);
        updates.after(this.state, input);
      }


      this.publish();
    }
  },

  publish() {
    for (let key of Object.keys(this.modules)) {
      this.modules[key](this.state.export());
    }
  },

  kickoff() {
    this.compute({ type: 'go' });
  },
};

export { core };
