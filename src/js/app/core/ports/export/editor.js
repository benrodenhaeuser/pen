import { h } from './dir.js';

const editor = state => {
  return state.exportToSVG();
};

export { editor };
