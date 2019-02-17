const clock = {
  init(time = 0) {
    this.time = time;
    return this;
  },

  tick() {
    this.time += 1;
  },
};

export { clock };
