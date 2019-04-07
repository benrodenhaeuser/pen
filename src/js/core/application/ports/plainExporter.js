const plainExporter = {
  build(node) {
    return JSON.parse(JSON.stringify(node));
  },
};

export { plainExporter };
