const Segment = {
  create(type, controls) {
    return Object.create(Segment).init(type, controls);
  },

  get anchor() {
    return this.controls[this.controls.length - 1];
  },

  get handles() {
    const notLast = (control, index) => {
      return !!this.controls[index + 1]
    }

    return this.controls.filter(notLast);
  },

  init(type, controls) {
    this.type = type;
    this.controls = controls;

    return this;
  },
};

export { Segment };
