const docToObject = doc => {
  return {
    doc: JSON.parse(JSON.stringify(doc)),
  };
};

export { docToObject };
