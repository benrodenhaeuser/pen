const Segment = {
  create(type, controls) {
    return Object.create(Segment).init(type, controls);
  },

  init(type, controls) {
    this.type = type;
    this.controls = controls;

    return this;
  },
};

export { Segment };
