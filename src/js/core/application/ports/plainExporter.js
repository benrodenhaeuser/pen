const plainExporter = {
  build(store) {
    return {
      doc:  JSON.parse(JSON.stringify(store.doc)),
      docs: store.docs.children.map(child => child.payload.id),
      // ^ TODO: note that we don't have the appropriate interface yet
      // and question: why are we doing this?
    };
  },
};

export { plainExporter };
