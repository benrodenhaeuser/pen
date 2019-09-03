import { core } from './app/core.js';
import * as devices from './app/periphery/_.js';

// exclude as needed for development purposes:
// const excluded = [devices.message, devices.db];
const excluded = [];

const app = {
  init() {
    core.init(document.querySelector('#canvas-wrapper').clientWidth);

    for (let device of Object.values(devices)) {
      if (excluded.includes(device)) {
        continue;
      }

      device.requestSnapshot = label => core.state.snapshot(label);
      device.init();

      if (this.isInputDevice(device)) {
        device.bindEvents(core.compute.bind(core))
      };

      if (this.isOutputDevice(device)) {
        core.attach(device.name, device.react.bind(device));
      }
    }

    core.kickoff();
  },

  isInputDevice(device) {
    return !!device.bindEvents;
  },

  isOutputDevice(device) {
    return !!device.react;
  },
};

document.addEventListener('DOMContentLoaded', app.init.bind(app));
