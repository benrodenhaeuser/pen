import { blueprint } from './blueprint.js';
import { doc } from './doc.js';
import { actions } from './actions.js';

const machine = {
  addSubscriber(subscriber) {
    this.subscribers.push(subscriber);
  },

  publish(data) {
    for (let subscriber of this.subscribers) {
      subscriber.receive(data);
    }
  },

  handle(event) {
    const eventType = event.type;
    const nodeType  = event.target && event.target.dataset && event.target.dataset.type;
    const transition = this.blueprint[this.state.label].find(t => {
        return t.eventType === eventType &&
          (t.nodeType === nodeType || t.nodeType === undefined);
      });

    if (transition) {
      this.actions[transition.action](this.state, event);
      this.state.label = transition.nextLabel;
      this.state.messages = transition.messages || {};
      this.publish(this.state);
    }
  },

  init() {
    this.state = {
      doc: doc.init(),
      label: 'start',
      docIds: null,
      aux: {},
    };

    this.actions     = actions;
    this.blueprint   = blueprint;
    this.subscribers = [];

    return this;
  },
};

export { machine };
