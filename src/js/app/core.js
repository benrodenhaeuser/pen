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

  execute(input) {
    this.state.input = input;

    const transition = transitions.get(this.state, input);

    if (transition) {
      this.state.update = transition.do; // a string
      this.state.mode = transition.to.mode;
      this.state.label = transition.to.label;

      const update = updates[transition.do];

      if (update) {
        this.invoke(update, this.state, input);
      }

      this.publish();
    }
  },

  invoke(update, state, input) {
    update(this.state, input);
    updates.after(this.state, input);
  },

  publish() {
    for (let key of Object.keys(this.modules)) {
      this.modules[key](this.state.description);
    }

    this.state.snapshots = {};

    // console.log(JSON.stringify(this.state));
    // console.log(document.querySelector('#canvas'));
  },

  kickoff() {
    this.execute({ type: 'go' });
  },
};

export { core };
