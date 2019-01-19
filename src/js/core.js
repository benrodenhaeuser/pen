import { transitionTable } from './transitionTable.js';
import { doc } from './doc.js';
import { actions } from './actions.js';

const core = {
  syncPeriphery() {
    for (let peripheral of this.periphery) {
      peripheral(JSON.parse(JSON.stringify(this.state)));
    }
  },

  dispatch(input) {
    const transition = transitionTable.get([this.state.label, input.label]);

    if (transition) {
      const action = actions[transition.action] || actions[input.label];
      action && action.bind(actions)(this.state, input);
      this.state.lastInput = input.label;
      this.state.label = transition.to || this.state.label;
      this.syncPeriphery();
    }
  },

  init() {
    this.state = {
      doc: doc.init(),   // domain state
      label: 'start',    // app state
      docIDs: null,      // app state
    };

    actions.init();
    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.dispatch({ label: 'kickoff' });
  },
};

export { core };
