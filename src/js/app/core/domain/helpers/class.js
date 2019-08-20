const Class = {
  create(classNames = []) {
    return Object.create(Class).init(classNames);
  },

  init(classNames) {
    if (classNames instanceof Array) {
      this.list = [...classNames];
    } else {
      throw new Error('Create Class instances from array!');
    }

    return this;
  },

  // return value: string
  toString() {
    return this.list.join(' ');
  },

  toJSON() {
    return this.list;
  },

  // return value: boolean
  includes(className) {
    return this.list.indexOf(className) >= 0;
  },

  // return value: new Class instance, does not mutate this (or its list)
  add(className) {
    return Class.create([...this.list, className]);
  },

  // return value: new Class instance, does not mutate this (or its list)
  remove(className) {
    return Class.create(this.list.filter(elem => elem !== className));
  },
};

export { Class };
