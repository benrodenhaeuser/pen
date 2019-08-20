const ProtoNode = {
  defineProps(propNames) {
    for (let propName of propNames) {
      Object.defineProperty(this, propName, {
        get() {
          return this.props[propName];
        },

        set(value) {
          this.props[propName] = value;

          if (this.isSceneNode()) {
            this.invalidateCache();
          }
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

  toJSON() {
    return {
      type: this.type,
      children: this.children,
      props: this.props,
    };
  },
};

export { ProtoNode };
