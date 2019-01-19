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
    const transition = transitionTable.get([this.state.id, input.id]);

    if (transition) {
      const action = actions[transition.action] || actions[input.id];
      action && action.bind(actions)(this.state, input);
      this.state.lastInputID = input.id;
      this.state.id = transition.to || this.state.id;
      this.syncPeriphery();
    }
  },

  init() {
    this.state = {
      doc: doc.init(),   // domain state
      id: 'start',    // app state
      docIDs: null,      // app state
    };

    actions.init();
    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.dispatch({ id: 'kickoff' });
  },
};

export { core };
