const clock = {
  tick() {
    this.time += 1;
  },

  init() {
    this.time = 0;
    return this;
  },
};

export { clock };
