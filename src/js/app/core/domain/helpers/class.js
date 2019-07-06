const Class = {
  create(classNames = []) {
    return Object.create(Class).init(classNames);
  },

  init(classNames) {
    if (classNames instanceof Array) {
      this.set = new Set(classNames);
    } else if (classNames instanceof Set) {
      this.set = classNames;
    } else {
      throw new Error('Create Class instances from array or set');
    }

    return this;
  },

  // return value: string
  toString() {
    return Array.from(this.set).join(' ');
  },

  toJSON() {
    return Array.from(this.set);
  },

  // return value: boolean
  includes(className) {
    return this.set.has(className);
  },

  // return value: new Class instance
  add(className) {
    return Class.create(this.set.add(className));
  },

  // return value: new Class instance
  remove(className) {
    this.set.delete(className);
    return Class.create(this.set);
  },
};

export { Class };
