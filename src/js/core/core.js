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
    console.log('from: ', this.state.id, input, transition); // DEBUG
    if (transition) {
      this.makeTransition(input, transition);
      console.log(this.state.id);
      this.sync();
    }
  },

  makeTransition(input, transition) {
    this.state.clock.tick();
    this.state.currentInput = input.type;
    this.state.id = transition.to;

    const action = actions[transition.do];
    action && action.bind(actions)(this.state, input);
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

export { core };


const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>

    <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>

    <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>

    <g>
      <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>

      <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
    </g>
  </svg>
`;

// const markup = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
//
//     <g>
//       <rect x="260" y="250" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
//
//       <g>
//         <rect x="400" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
//         <rect x="550" y="260" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
//       </g>
//     </g>
//
//     <rect x="600" y="600" width="100" height="100" fill="none" stroke="#e3e3e3"></rect>
//   </svg>
// `;

// const markup = `
//   <svg id="a3dbc277-3d4c-49ea-bad0-b2ae645587b1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
//     <defs>
//       <style>
//         .b6f794bd-c28e-4c2b-862b-87d53a963a38 {
//           fill: #1d1d1b;
//           stroke: #1d1d1b;
//           stroke-miterlimit: 3.86;
//           stroke-width: 1.35px;
//         }
//       </style>
//     </defs>
//     <title>Little Bus</title>
//     <path class="b6f794bd-c28e-4c2b-862b-87d53a963a38" d="M355.24,70.65l-77.31.66L93.69,179l-3.32,40.31L49.4,249l-4.64,62.08s.39,8.81,10.6,3.3C64,309.78,60,302.49,60,302.49l54.13,11.92s11.82,29.72,27.06,5.31l138.06-88.48s4.64,15.8,17.23,9.18,7.95-27.73,7.95-27.73l46.17-36.34ZM65.32,288.3A7.62,7.62,0,1,1,73,280.68,7.62,7.62,0,0,1,65.32,288.3Zm63.05,11.64a7.62,7.62,0,1,1,7.61-7.62A7.62,7.62,0,0,1,128.37,299.94Zm49.81-65.48L102.29,220l1.33-33.69,78.54,8Zm21.87,37-2-78.55L215.85,181l3.31,79.3Zm29.71-52.8-2-39.66,27.06-16.46,2.65,40.22Zm36.34-25.75-2.65-36.33,22.42-15.9,3.32,35Zm29.71-21.86-2-37.66,21.11-15.8,1.32,37.66Zm47.6-33.68L323.54,150l-.66-37L344.07,99.7Z"/>
//   </svg>
// `;
