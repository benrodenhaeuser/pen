const message = store => {
  return store.message.payload.text;
};

export { message };
