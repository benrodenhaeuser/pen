import { core } from '../../src/js/app/core.js';

const width = 800;

const app = {
  init() {
    this.core = core;

    core.init(width);
    core.kickoff();
  },
};

export { app };
