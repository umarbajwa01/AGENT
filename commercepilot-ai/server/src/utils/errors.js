export const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
