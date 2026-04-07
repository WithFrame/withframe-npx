// Checks whether a value is a string.
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

// Checks whether a value is callable.
const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => {
  return typeof value === 'function';
};

export { isString, isFunction };
