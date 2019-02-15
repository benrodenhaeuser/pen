import { clock } from './clock.js';
import { doc } from './doc.js';
import { transformers } from './transformers.js';
import { transitionTable } from './transitionTable.js';

const core = {
  get stateData() {
    return JSON.parse(JSON.stringify(this.state));
  },

  syncPeriphery() {
    const keys = Object.keys(this.periphery);
    for (let key of keys) {
      this.periphery[key](JSON.parse(JSON.stringify(this.state)));
    }
  },

  // TODO: write a proper function to initalize state from stateData
  setState(stateData) {
    this.state = stateData;
    this.state.doc = doc.init(stateData.doc);
    this.state.clock = clock.init(stateData.clock.time);
    this.periphery['ui'] &&
      this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
    // ^ only UI is synced
    // ^ TODO: call syncPeriphery here, and make that method more flexible
  },

  processInput(input) {
    const transition = transitionTable.get([this.state.id, input.id]);

    if (transition) {
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
      doc: doc.init(markup),
      docs: { ids: [], selectedID: null },
    };

    transformers.init();
    this.periphery = [];
    return this;
  },

  // TODO: why do we need this function? why can't we just do:
  //   this.processInput({ id: 'kickoff' });
  // ?
  kickoff() {
    this.syncPeriphery();
    this.processInput({ id: 'kickoff' });
    // ^ TODO: this involves two syncs, is that really necessary?
  },
};

const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">

    <g>
      <circle cx="200" cy="200" r="50"></circle>
      <g>
        <rect x="260" y="250" width="100" height="100"></rect>
        <rect x="400" y="250" width="100" height="100"></rect>
      </g>
    </g>

    <rect x="400" y="400" width="100" height="100"></rect>
  </svg>
`;

export { core };
