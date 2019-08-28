import { core } from './app/core.js';
import * as devices from './app/periphery/_.js';

// exclude as needed for development purposes:
// const excluded = [devices.message, devices.db];
const excluded = [];

const app = {
  init() {
    core.init();

    for (let device of Object.values(devices)) {
      if (excluded.includes(device)) {
        continue;
      }

      device.requestSnapshot = label => core.state.snapshot(label);
      device.init();
      device.bindEvents && device.bindEvents(core.compute.bind(core));
      device.react && core.attach(device.name, device.react.bind(device));
    }

    core.kickoff();
  },
};

document.addEventListener('DOMContentLoaded', app.init);
