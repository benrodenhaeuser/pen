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

  kickoff(canvasSize) {
    this.state.store.scene.viewBox.width  = canvasSize.width;
    this.state.store.scene.viewBox.height = canvasSize.height;

    this.publish(); // TODO: is this necessary? why?
    this.compute({ type: 'go' });
  },

  // TODO:
  // if the argument is a state, then we set the state
  // if the argument is an input, then we use that input

  // how to distinguish between the two? I think both are plain objects

  compute(input) {
    if (input.doc !== undefined) { // it's a state (TODO: improve this)
      this.setState(input);
      return;
    }

    const transition = transitions.get(this.state, input);

    if (transition) {
      this.makeTransition(input, transition);
      this.publish();
    }
  },

  makeTransition(input, transition) {
    this.state.actionLabel = transition.do;
    this.state.label       = transition.to;

    console.log(this.state.label);

    const action = actions[transition.do];
    action && action.bind(actions)(this.state, input);
  },

  publish() {
    const keys = Object.keys(this.periphery);
    for (let key of keys) {
      this.periphery[key](this.state.export());
      // ^ uses `receive`, I think
    }
  },

  setState(plainState) {

    this.state.store.scene.replaceWith(this.state.importFromPlain(plainState.doc));
    // ^ TODO: very complicated!
    console.log(this.state);
    this.periphery['ui'](this.state.export());
  },
};

export { core };
