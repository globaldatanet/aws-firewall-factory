
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const regExReviver = (key: string, value: any) => {
  if (typeof value === "string" && value.startsWith("/") && value.endsWith("/")) {
    const parts = value.match(/^\/(.*)\/([a-z]*)$/);
    if (parts) {
      return new RegExp(parts[1], parts[2]); // Convert string back to RegExp
    }
  }
  return value;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const regExReplacer = (key: string, value: any) => {
  if (value instanceof RegExp) {
    return value.toString(); // Convert RegExp to string
  }
  return value;
};