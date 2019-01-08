const machine = {
  addObserver(observer) {
    this.observers.push(observer);
  },

  notifyObservers(data, message) {
    for (let observer of this.observers) {
      observer.update(data, message);
    }
  },

  dispatch(event) {
    const eventType = event.type;
    const nodeType  = event.target.dataset && event.target.dataset.type;

    const transition = this.blueprint[this.state].find(t => {
      return t.eventType === eventType &&
        (t.nodeType === nodeType || t.nodeType === undefined);
    });

    if (transition) {
      this.actions[transition.action](event);
      this.state = transition.nextState;
      this.notifyObservers(this.model.data, transition.message);
    }
  },

  init(model, actions, blueprint) {
    this.model     = model;
    this.actions   = actions;
    this.blueprint = blueprint;
    this.observers = [];
    this.state     = 'start';

    return this;
  },
};

export { machine };
