export const getBaseUrl = (): string => {
  return process.env.BASE_URL ?? 'https://jsonplaceholder.typicode.com';
};
