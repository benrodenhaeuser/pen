const proxify = (node, parent = null) => {
  if (parent) { node.parent = parent; }

  const proxy = new Proxy(node, handler);
  this.children = this.children.map( child => proxify(child, proxy) );
  return proxy;
};

const handler = {
  get(node, propKey) {
    if (node.props[propKey] !== undefined) {
      return Reflect.get(node.props, propKey);
    } else {
      return Reflect.get(node, propKey);
    }
  },

  set(node, propKey, propValue) {
    if (['bounds', '_id'].includes(propKey)) {
      return;
    }

    for (ancestor of node.ancestors) {
      ancestor._id = createID();
      ancestor.memoizeBounds();
    }

    if (node.props[propKey] !== undefined) {
      Reflect.set(node.props, propKey, propValue);
    } else {
      Reflect.set(node, propKey, propValue);
    }
  },
};

const createID = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);
  return randomString + timestamp;
};
