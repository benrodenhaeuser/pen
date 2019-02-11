const ClassList = {
  add(className) {
    this.c.add(className);
  },

  includes(className) {
    return this.c.has(className);
  },

  remove(className) {
    this.c.delete(className);
  },

  toJSON() {
    return Array.from(this.c).join(' ');
  },

  init(classList) {
    this.c = new Set(classList) || newSet([]);
    return this;
  },
};

export { ClassList };
