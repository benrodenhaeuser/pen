import { Node  } from '../domain/node.js';
import { clock } from './clock.js';

const State = {
  create() {
    return Object.create(State).init();
  },

  // note below that `markup` is currently hard-coded
  init() {
    this.clock = clock.init();
    this.id    = 'start';
    this.scene = Node.createFromMarkup(markup);
    this.docs  = { ids: [], selectedID: null };

    return this;
  },

  toJSON() {
    return {
      clock: this.clock,
      id: this.id,
      scene: this.scene.toVDOM(),
      docs: this.docs,
    };
  },
};

export { State };

// const markup = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260.73 100.17"><defs><style>.cls-1{fill:#2a2a2a;}</style></defs><title>Logo_48_Web_160601</title>
//
//     <path class="cls-1" d="M69.74,14H35.82S37,54.54,10.37,76.65v7.27H51.27V97.55s-1.51,7.27-12.42,7.27v6.06H87.31v-6.66S74.59,106,74.59,98.46V83.91h13v-7h-13V34.4L51.21,55.31V77H17.34S65.5,32.43,69.74,14" transform="translate(-10.37 -12.38)"/>
//
//     <path class="cls-1" d="M142,39.59q0-14.42-3.23-20.89a6.56,6.56,0,0,0-6.32-3.82q-9.71,0-9.71,21.77t10.74,21.62a6.73,6.73,0,0,0,6.62-4.12Q142,50,142,39.59m3.83,49.13q0-15.59-2.87-21.92t-10.08-6.32a10.21,10.21,0,0,0-9.78,5.88q-3,5.88-3,19.12,0,12.94,3.46,18.75T134.63,110q6,0,8.61-4.93t2.58-16.4m24-4.41q0,10.59-8.53,18.39-10.74,9.86-27.51,9.86-16.19,0-26.77-7.65T96.38,85.49q0-13.83,10.88-20.45,5.15-3.09,14.56-5.59l-0.15-.74q-20.89-5.3-20.89-21.77a21.6,21.6,0,0,1,8.68-17.65q8.68-6.91,22.21-6.91,14.56,0,23.39,6.77a21.35,21.35,0,0,1,8.83,17.8q0,15-19,21.92v0.59q24.86,5.44,24.86,24.86" transform="translate(-10.37 -12.38)"/>
//
//     <g>
//       <path class="cls-1" d="M185.85,53.73V34.82c0-4.55-1.88-6.9-9.41-8.47V20.7L203.67,14h5.49V53.73H185.85Z" transform="translate(-10.37 -12.38)"/>
//
//       <path class="cls-1" d="M232,55.82c0-1.73-.63-2.2-8-2v-6.9h38v6.9c-11.26.45-11.9,1.84-20.68,9.37L236,67.73l18,22.91c8.63,10.83,11,13.71,17.1,14.34v5.9H227.57a37.69,37.69,0,0,1,0-5.9,5,5,0,0,0,5-3.78L218.23,83.54s-8.77,6.94-9.18,12.28c-0.57,7.27,5.19,9.16,11,9.16v5.9H176.69V105S232,56.76,232,55.82Z" transform="translate(-10.37 -12.38)"/>
//     </g>
//   </svg>
// `;

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

// empty svg with viewBox
const markup = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"></svg>
`;

// const markup = `
//   <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 405"><g fill="#ff0000" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M50.5869,148.3516c-0.2308,-43.67734 -0.2308,-43.67734 -24.7598,-54.57743c-24.529,-10.90009 -24.529,-10.90009 -24.529,55.34c0,66.2401 0,66.2401 24.7598,54.57743c24.7598,-11.66267 24.7598,-11.66267 24.529,-55.34z"/><path d="M21.62818,330.71352c-20.56368,-15.09293 -20.56368,-15.09293 -20.56368,28.5276c0,43.62053 0,43.62053 19.55435,43.62053c19.55435,0 19.55435,0 20.56368,-28.5276c1.00933,-28.5276 1.00933,-28.5276 -19.55435,-43.62053z"/><path d="M107.96977,0.50937c0.73005,-0.48695 0.73005,-0.48695 -1.01175,-0.48695c-1.7418,0 -1.7418,0 -0.73005,0.48695c1.01175,0.48695 1.01175,0.48695 1.7418,0z"/><path d="M74.97452,87.43121c23.24606,-12.27663 23.24606,-12.27663 26.41619,-48.12571c3.17013,-35.84908 1.14663,-36.82298 -48.78682,-36.82298c-49.93345,0 -49.93345,0 -49.93345,37.71256c0,37.71256 0,37.71256 24.529,48.61266c24.529,10.90009 24.529,10.90009 47.77507,-1.37653z"/><path d="M79.76578,203.77243c24.86172,11.77861 24.86172,11.77861 49.61865,3.24961c24.75693,-8.529 24.75693,-8.529 29.23518,-52.52805c4.47825,-43.99905 4.47825,-43.99905 -26.60339,-59.20358c-31.08164,-15.20453 -31.08164,-15.20453 -54.3277,-2.9279c-23.24606,12.27663 -23.24606,12.27663 -23.01526,55.95397c0.2308,43.67734 0.2308,43.67734 25.09252,55.45595z"/><path d="M70.59973,326.80235c26.89466,-14.35367 26.89466,-14.35367 29.05785,-59.7788c2.16319,-45.42513 2.16319,-45.42513 -22.69853,-57.20374c-24.86172,-11.77861 -24.86172,-11.77861 -49.62152,-0.11595c-24.7598,11.66267 -24.7598,11.66267 -24.7598,56.46448c0,44.80181 0,44.80181 20.56368,59.89474c20.56368,15.09293 20.56368,15.09293 47.45834,0.73926z"/><path d="M129.84987,328.44011c-29.97881,-11.37576 -29.97881,-11.37576 -56.87347,2.97791c-26.89466,14.35367 -26.89466,14.35367 -27.90399,42.88126c-1.00933,28.5276 -1.00933,28.5276 34.40359,28.5276c35.41292,0 35.41292,0 57.88279,-31.5055c22.46988,-31.5055 22.46988,-31.5055 -7.50893,-42.88126z"/><path d="M187.06059,96.11957c21.47119,-9.59579 21.47119,-9.59579 22.49175,-51.54056c1.02056,-41.94477 1.02056,-41.94477 -48.65265,-41.94477c-49.67321,0 -51.13331,0.9739 -54.30344,36.82298c-3.17013,35.84908 -3.17013,35.84908 27.91151,51.05361c31.08164,15.20453 31.08164,15.20453 52.55283,5.60874z"/><path d="M245.34605,206.18022c33.14602,-20.86668 33.14602,-20.86668 30.2472,-54.58075c-2.89882,-33.71407 -2.89882,-33.71407 -33.43397,-46.74428c-30.53515,-13.03021 -30.53515,-13.03021 -52.00634,-3.43443c-21.47119,9.59579 -21.47119,9.59579 -25.94945,53.59483c-4.47825,43.99905 -4.47825,43.99905 21.75914,58.01517c26.23739,14.01613 26.23739,14.01613 59.38342,-6.85056z"/><path d="M195.80525,326.19818c21.96942,-10.19253 21.96942,-10.19253 17.69765,-51.84721c-4.27177,-41.65468 -4.27177,-41.65468 -30.50916,-55.67081c-26.23739,-14.01613 -26.23739,-14.01613 -50.99432,-5.48713c-24.75693,8.529 -24.75693,8.529 -26.92012,53.95413c-2.16319,45.42513 -2.16319,45.42513 27.81562,56.80089c29.97881,11.37576 40.9409,12.44265 62.91033,2.25012z"/><path d="M227.51873,402.9056c49.30296,0 49.30296,0 45.96844,-29.33069c-3.33452,-29.33069 -3.33452,-29.33069 -27.86991,-41.16459c-24.53539,-11.83389 -24.53539,-11.83389 -46.50481,-1.64137c-21.96942,10.19253 -21.96942,10.19253 -21.43305,41.16459c0.53637,30.97206 0.53637,30.97206 49.83933,30.97206z"/><path d="M339.22874,3.60137c9.5027,-3.44282 9.5027,-3.44282 -4.69103,-3.44282c-14.19373,0 -14.19373,0 -9.5027,3.44282c4.69103,3.44282 4.69103,3.44282 14.19373,0z"/><path d="M297.32885,95.81776c22.09241,-16.92833 22.09241,-16.92833 25.64882,-51.53216c3.5564,-34.60384 -5.82566,-41.48947 -56.29804,-41.48947c-50.47238,0 -50.47238,0 -51.49294,41.94477c-1.02056,41.94477 -1.02056,41.94477 29.51459,54.97498c30.53515,13.03021 30.53515,13.03021 52.62756,-3.89812z"/><path d="M315.52969,202.76801c31.17916,17.74268 31.17916,17.74268 49.30204,10.55348c18.12288,-7.18921 18.12288,-7.18921 24.75761,-50.72443c6.63474,-43.53522 6.63474,-43.53522 -30.10845,-61.19587c-36.74318,-17.66065 -36.74318,-17.66065 -58.8356,-0.73232c-22.09241,16.92833 -22.09241,16.92833 -19.19359,50.64239c2.89882,33.71407 2.89882,33.71407 34.07798,51.45675z"/><path d="M248.25403,327.5441c24.53539,11.83389 24.53539,11.83389 51.87383,-2.72394c27.33844,-14.55783 27.33844,-14.55783 35.51803,-56.61257c8.17959,-42.05474 8.17959,-42.05474 -22.99957,-59.79743c-31.17916,-17.74268 -31.17916,-17.74268 -64.32519,3.124c-33.14602,20.86668 -33.14602,20.86668 -28.87425,62.52137c4.27177,41.65468 4.27177,41.65468 28.80716,53.48857z"/><path d="M334.71096,402.7916c52.47028,0 52.47028,0 55.59477,-27.50337c3.1245,-27.50337 3.1245,-27.50337 -28.46636,-43.88853c-31.59085,-16.38516 -31.59085,-16.38516 -58.9293,-1.82732c-27.33844,14.55783 -27.33844,14.55783 -24.00392,43.88853c3.33452,29.33069 3.33452,29.33069 55.8048,29.33069z"/><path d="M437.28803,1.64447c2.69179,-1.57207 2.69179,-1.57207 -3.64826,-1.57207c-6.34004,0 -6.34004,0 -2.69179,1.57207c3.64826,1.57207 3.64826,1.57207 6.34004,0z"/><path d="M423.47215,101.0203c24.76808,-13.22625 24.76808,-13.22625 16.75607,-54.13524c-8.01201,-40.90899 -15.30852,-44.05313 -52.10041,-44.05313c-36.79189,0 -36.79189,0 -46.29459,3.44282c-9.5027,3.44282 -9.5027,3.44282 -13.05911,38.04665c-3.5564,34.60384 -3.5564,34.60384 33.18678,52.26449c36.74318,17.66065 36.74318,17.66065 61.51126,4.43441z"/><path d="M473.2864,212.58868c30.39492,-14.89085 30.39492,-14.89085 33.55771,-54.98674c3.16279,-40.09589 3.16279,-40.09589 -26.12633,-52.36114c-29.28911,-12.26525 -29.28911,-12.26525 -54.05719,0.961c-24.76808,13.22625 -24.76808,13.22625 -31.40281,56.76146c-6.63474,43.53522 -6.63474,43.53522 20.49948,54.02574c27.13422,10.49052 27.13422,10.49052 57.52914,-4.40033z"/><path d="M423.24411,333.73001c26.92878,-9.8882 26.92878,-9.8882 21.84583,-55.13858c-5.08295,-45.25039 -5.08295,-45.25039 -32.21717,-55.74091c-27.13422,-10.49052 -27.13422,-10.49052 -45.25709,-3.30131c-18.12288,7.18921 -18.12288,7.18921 -26.30247,49.24395c-8.17959,42.05474 -8.17959,42.05474 23.41126,58.4399c31.59085,16.38516 31.59085,16.38516 58.51964,6.49696z"/><path d="M475.05699,339.05927c-22.21507,-10.7426 -22.21507,-10.7426 -49.14385,-0.85441c-26.92878,9.8882 -26.92878,9.8882 -30.05328,37.39157c-3.1245,27.50337 -3.1245,27.50337 47.87861,27.50337c51.00311,0 51.00311,0 52.26835,-26.64896c1.26524,-26.64896 1.26524,-26.64896 -20.94983,-37.39157z"/><path d="M482.61699,100.04921c29.28911,12.26525 29.28911,12.26525 42.03328,5.31362c12.74416,-6.95163 12.74416,-6.95163 12.74416,-54.74631c0,-47.79468 0,-47.79468 -47.3535,-47.79468c-47.3535,0 -52.73707,3.14414 -44.72506,44.05313c8.01201,40.90899 8.01201,40.90899 37.30112,53.17424z"/><path d="M539.2026,162.82026c0,-59.13683 0,-59.13683 -12.74416,-52.18521c-12.74416,6.95163 -12.74416,6.95163 -15.90695,47.04752c-3.16279,40.09589 -3.16279,40.09589 12.74416,52.18521c15.90695,12.08932 15.90695,12.08932 15.90695,-47.04752z"/><path d="M477.40768,334.44837c22.21507,10.7426 22.21507,10.7426 41.21892,2.089c19.00385,-8.6536 19.00385,-8.6536 19.00385,-58.79452c0,-50.14092 0,-50.14092 -15.90695,-62.23023c-15.90695,-12.08932 -15.90695,-12.08932 -46.30187,2.80153c-30.39492,14.89085 -30.39492,14.89085 -25.31197,60.14123c5.08295,45.25039 5.08295,45.25039 27.29802,55.99299z"/><path d="M499.68158,376.59488c-1.26524,26.64896 -1.26524,26.64896 19.00385,26.64896c20.26909,0 20.26909,0 20.26909,-35.30257c0,-35.30257 0,-35.30257 -19.00385,-26.64896c-19.00385,8.6536 -19.00385,8.6536 -20.26909,35.30257z"/><path d="M167.79565,340.87524c-5.48105,-0.53344 -5.48105,-0.53344 -27.95093,30.97206c-22.46988,31.5055 -22.46988,31.5055 6.01742,31.5055c28.4873,0 28.4873,0 27.95093,-30.97206c-0.53637,-30.97206 -0.53637,-30.97206 -6.01742,-31.5055z"/></g></svg>
// `;
