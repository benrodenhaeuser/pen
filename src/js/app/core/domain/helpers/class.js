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

  // return value: new Class instance
  // does not mutate this/this.list
  // will add className only if not already present
  add(className) {
    if (this.includes(className)) {
      return Class.create(this.list);
    } else {
      return Class.create([...this.list, className]);
    }
  },

  // return value: new Class instance
  // does not mutate this/this.list
  // will remove multiple instances of className, if present
  remove(className) {
    return Class.create(this.list.filter(elem => elem !== className));
  },
};

export { Class };
