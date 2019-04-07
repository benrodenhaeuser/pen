const plainExporter = {
  buildPlain(node) {
    return JSON.parse(JSON.stringify(node));
  },
};

export { plainExporter };
