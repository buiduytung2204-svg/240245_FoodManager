function validateApiUrl(value) {
  const input = String(value ?? '').trim().replace(/\/+$/, '');
  let url;
  try {
    url = new URL(input);
  } catch {
    throw Error('invalidApiUrl');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || input.includes('YOUR_PROJECT') || /\/(240245_Dish|240245_DishCategory)$/.test(url.pathname)) throw Error('invalidApiUrl');
  return url.toString().replace(/\/+$/, '');
}
module.exports = {
  validateApiUrl
};
