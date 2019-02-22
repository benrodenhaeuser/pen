import { clock } from './clock.js';
import { doc } from './doc.js';
import { actions } from './actions.js';
import { table } from './table.js';

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

  // TODO: not functional right now
  setState(stateData) {
    this.state = stateData;
    this.state.doc = doc.init(stateData.doc);
    this.state.clock = clock.init(stateData.clock.time);
    this.periphery['ui'] &&
      this.periphery['ui'](JSON.parse(JSON.stringify(this.state)));
    // ^ only UI is synced
    // ^ TODO: call syncPeriphery here, and make that method more flexible
  },

  // TODO: processInput is not a good name

  processInput(input) {
    const transition = table.get(this.state, input);
    console.log('from: ', this.state.id, input, transition);
    if (transition) {
      this.doTransition(input, transition);
      this.syncPeriphery();
    }
  },

  // TODO: transform is not a good name

  doTransition(input, transition) {
    const action = actions[transition.do];
    action && action.bind(actions)(this.state, input);
    // ^ means it's fine if we don't find an action
    //   TODO: maybe it shouldn't be fine?

    this.state.clock.tick();
    this.state.currentInput = input.type;
    this.state.id = transition.to;
  },

  init() {
    this.state = {
      clock: clock.init(),
      id: 'start',
      doc: doc.init(markup),
      docs: { ids: [], selectedID: null },
    };

    this.periphery = [];
    return this;
  },

  kickoff() {
    this.syncPeriphery();
    this.processInput({ type: 'kickoff' });
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
