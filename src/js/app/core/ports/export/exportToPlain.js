const exportToPlain = store => {
  return {
    doc: JSON.parse(JSON.stringify(store.doc)),
  };
};

export { exportToPlain };
