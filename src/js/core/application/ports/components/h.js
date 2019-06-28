const h = (tag, props = {}, ...children) => {
  return {
    tag: tag,
    props: props,
    children: children || [],
  };
};

export { h };
