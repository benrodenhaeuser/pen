const clock = {
  tick() {
    this.time += 1;
  },

  init(time) {
    this.time = time || 0;
    return this;
  },
};

export { clock };
