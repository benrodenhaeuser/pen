import { clock } from './clock.js';
import { doc } from './doc.js';
import { actions } from './actions.js';
import { transitionTable } from './transitionTable.js';

const core = {
  syncPeriphery() {
    for (let func of this.periphery) {
      func(JSON.parse(JSON.stringify(this.state)));
    }
  },

  dispatch(input) {
    const transition = transitionTable.get([this.state.id, input.id]);

    if (transition) {
      this.state.clock.tick();
      const action = actions[transition.do] || actions[input.id];
      action && action.bind(actions)(this.state, input);
      this.state.currentInput = input.id;
      this.state.id = transition.to || this.state.id;
      this.syncPeriphery();
    }
  },

  init() {
    this.state = {
      clock: clock.init(),
      id: 'start',
      doc: doc.init(),
      docs: { ids: [], selectedID: null },
    };

    actions.init();
    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.dispatch({ id: 'kickoff' });
    // ^ TODO: this involves two syncs, is that really necessary?
  },
};

export { core };
