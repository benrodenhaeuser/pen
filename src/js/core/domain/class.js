const Class = {
  create(classNames = []) {
    return Object.create(Class).init(classNames);
  },

  init(classNames) {
    this.set = new Set(classNames);
    return this;
  },

  toJSON() {
    return Array.from(this.set).join(' ');
  },

  includes(className) {
    return this.set.has(className);
  },

  add(className) {
    this.set.add(className);
  },

  remove(className) {
    this.set.delete(className);
  },
};

export { Class };
