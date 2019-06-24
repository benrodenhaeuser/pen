const plainExporter = {
  build(store) {
    return {
      doc:  JSON.parse(JSON.stringify(store.doc)),
      docs: store.docs.children.map(child => child.payload.id),
      // ^ TODO: I think we don't need `docs`
    };
  },
};

export { plainExporter };
