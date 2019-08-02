const ProtoNode = {
  defineProps(propNames) {
    for (let propName of propNames) {
      Object.defineProperty(this, propName, {
        get() {
          return this.payload[propName];
        },

        set(value) {
          this.payload[propName] = value;
        },
      });
    }

    return this;
  },

  set(opts) {
    for (let key of Object.keys(opts)) {
      this[key] = opts[key];
    }

    return this;
  },
};

export { ProtoNode };
