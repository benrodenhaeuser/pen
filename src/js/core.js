import { clock } from './clock.js';
import { doc } from './doc.js';
import { transformers } from './transformers.js';
import { transitionTable } from './transitionTable.js';

const core = {
  syncPeriphery() {
    const keys = Object.keys(this.periphery);

    for (let key of keys) {
      this.periphery[key](JSON.parse(JSON.stringify(this.state)));
    }
  },

  setState(state) {
    this.state = state;
    // TODO: this overwrites our custom app object.
    // need to "restore" a proper state object.
    this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
  },

  process(input) {
    const transition = transitionTable.get([this.state.id, input.id]);

    if (transition) {
      console.log(input.id);
      this.transform(input, transition);
      this.syncPeriphery();
    }
  },

  transform(input, transition) {
    const transformer = transformers[transition.do] || transformers[input.id];
    transformer && transformer.bind(transformers)(this.state, input);

    this.state.clock.tick();
    this.state.currentInput = input.id;
    this.state.id = transition.to || this.state.id;
  },

  init() {
    this.state = {
      clock: clock.init(),
      id: 'start',
      doc: doc.init(),
      docs: { ids: [], selectedID: null },
    };

    transformers.init();
    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.process({ id: 'kickoff' });
    // ^ TODO: this involves two syncs, is that really necessary?
  },
};

export { core };
