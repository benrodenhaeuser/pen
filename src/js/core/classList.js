const ClassList = {
  add(className) {
    this.set.add(className);
  },

  includes(className) {
    return this.set.has(className);
  },

  remove(className) {
    this.set.delete(className);
  },

  toJSON() {
    return Array.from(this.set).join(' ');
  },

  init(classList) {
    this.set = new Set(classList) || newSet([]);
    return this;
  },
};

export { ClassList };
