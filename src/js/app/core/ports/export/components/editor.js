import { h } from './h.js';

const editor = state => {
  return state.exportToSVG();
};

export { editor };
