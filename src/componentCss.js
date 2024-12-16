/** @type {Map<string, Promise<CSSStyleSheet>>} */
const CACHE = new Map();

export default (/** @type {string} */ path) => {
    if (CACHE.has(path)) {
        return CACHE.get(path);
    }

    const url = new URL(path, window.location.href);

    const lookup = fetch(path)
        .then((r) => r.text())
        .then((css) => {
            const res = new CSSStyleSheet({ baseURL: url.toString() });
            return res.replace(css);
        });

    CACHE.set(path, lookup);

    return lookup;
};
