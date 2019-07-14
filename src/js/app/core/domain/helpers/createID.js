const createID = () => {
  const randomString = Math.random()
    .toString(36)
    .substring(2);
  const timestamp = new Date().getTime().toString(36);
  return randomString + timestamp;
};

export { createID };
