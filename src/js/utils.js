const createId = () => {
  const randomString = Math.random().toString(36).substring(2);
  const timestamp    = (new Date()).getTime().toString(36);

  return randomString + timestamp;
};

export { createId };

// need globally unique ids across sessions.
// solution: instead of incrementing, generate
// something that is more or less guaranteed to be unique:

// let uniqueId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
