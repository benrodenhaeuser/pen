import { clock } from './clock.js';
import { doc } from './doc.js';
import { actions } from './actions.js';
import { config } from './config.js';

const core = {
  get stateData() {
    return JSON.parse(JSON.stringify(this.state));
  },

  // TODO: This name is GOOD
  sync() {
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
    // ^ TODO: call sync here, and make that method more flexible
  },

  compute(input) {
    const transition = config.get(this.state, input);
    console.log('from: ', this.state.id, input, transition);
    if (transition) {
      this.makeTransition(input, transition);
      this.sync();
    }
  },

  makeTransition(input, transition) {
    const action = actions[transition.do];
    action && action.bind(actions)(this.state, input);
    // ^ means it's fine if we don't find an action

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
    this.sync();
    this.compute({ type: 'kickoff' });
  },
};

// hard-coded svg:

// const markup = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>
//
//     <g id="four">
//       <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>
//       </g>
//
//     <g id="eight">
//       <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>
//     </g>
//
//     <g id="k">
//       <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>
//
//       <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
//     </g>
//   </svg>
// `;


// const markup = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
//     <path d="M400 400H500V500H400z"></path>
//   </svg>
// `;

const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">

    <g>
      <g>
        <rect x="260" y="250" width="100" height="100"></rect>

        <g>
          <rect x="400" y="260" width="100" height="100"></rect>
          <rect x="550" y="260" width="100" height="100"></rect>
        </g>
      </g>
    </g>

    <rect x="600" y="600" width="100" height="100"></rect>
  </svg>
`;

export { core };
