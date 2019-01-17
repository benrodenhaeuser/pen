import { transitionMap } from './transitionMap.js';
import { doc } from './doc.js';
import { actions } from './actions.js';

const core = {
  attach(component) {
    this.periphery.push(component);
  },

  syncPeriphery() {
    for (let component of this.periphery) {
      component.sync(JSON.parse(JSON.stringify(this.state)));
    }
  },

  controller(input) {
    const transition = transitionMap.get([this.state.label, input.label]);

    if (transition) {
      actions[transition.action](this.state, input);
      this.state.label = transition.nextLabel;
      this.syncPeriphery();
    }
  },

  init() {
    this.state = {
      doc: doc.init(), // TODO: just initializing an empty doc is
      label: 'start',
      docIds: null,
    };

    actions.init();
    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.controller({ label: 'kickoff' });
  },
};

export { core };
