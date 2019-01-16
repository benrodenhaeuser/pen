import { transitionMap } from './transitionMap.js';
import { doc } from './doc.js';
import { actions } from './actions.js';

const core = {
  addSubscriber(subscriber) {
    this.subscribers.push(subscriber);
  },

  publishState() {
    for (let subscriber of this.subscribers) {
      subscriber.receive(JSON.parse(JSON.stringify(this.state)));
    }
    this.state.messages = {}; // be sure to never send a message twice!
  },

  controller(input) {
    const transition = transitionMap.get([this.state.label, input.label]);

    if (transition) {
      actions[transition.action](this.state, input);
      this.state.label = transition.nextLabel;
      this.state.messages = transition.messages || {};
      this.publishState();

      console.log("input: " + input.label + ',',"new state: " + this.state.label);
    }
  },

  init() {
    this.state = {
      doc: doc.init(),
      label: 'start',
      docIds: null,
      messages: {},
      aux: {},
    };

    this.subscribers = [];

    return this;
  },
};

export { core };
