const proxify = (node, parent = null) => {
  if (parent) { node.parent = parent; }

  const proxy = new Proxy(node, handler);
  this.children = this.children.map( child => proxify(child, proxy) );
  return proxy;
};

const handler = {
  get(instance, propKey) {
    if (instance.props[propKey] !== undefined) {
      return Reflect.get(instance.props, propKey);
    } else {
      return Reflect.get(instance, propKey);
    }
  },

  set(instance, propKey, propValue) {
    if (['bounds', '_id'].includes(propKey)) {
      return;
    }

    for (ancestor of instance.ancestors) {
      ancestor._id = createID();
      ancestor.memoizeBounds();
    }

    if (instance.props[propKey] !== undefined) {
      Reflect.set(instance.props, propKey, propValue);
    } else {
      Reflect.set(instance, propKey, propValue);
    }
  },
};

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};
