const machine = {
  addSubscriber(subscriber) {
    this.subscribers.push(subscriber);
  },

  publish(data, messages) {
    for (let subscriber of this.subscribers) {
      subscriber.receive(data, messages);
    }
  },

  make(transition) {
    this.actions[transition.action](event);
    this.state = transition.nextState;
    this.publish(this.model.data, transition.messages || {});
  },

  dispatch(event) {
    const eventType = event.type;
    const nodeType  = event.target && event.target.dataset && event.target.dataset.type;
    const transition = this.blueprint[this.state].find(t => {
        return t.eventType === eventType &&
          (t.nodeType === nodeType || t.nodeType === undefined);
      });

    if (transition) { this.make(transition); }
  },

  init(model, actions, blueprint) {
    this.model     = model;
    this.actions   = actions;
    this.blueprint = blueprint;
    this.subscribers = [];
    this.state     = 'idle';

    return this;
  },
};

export { machine };
