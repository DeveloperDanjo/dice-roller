/**
 * @typedef {{
 *   get(max: number): Promise<number>;
 * }} Random
 */

/** @implements {Random} */
class Native {
    async get (/** @type {number} */ max) {
        return 1 + Math.floor(Math.random() * max);
    }
};

/** @implements {Random} */
class LegacyRO {
    #cacheCapacityPerDie = 100;
    #bitMin = 10000;

    /** @type {Map<number, number[]>} */
    #caches = new Map();

    constructor() {
        setInterval(() => {
            fetch('https://www.random.org/quota/?format=plain')
                .then((r) => r.text())
                .then((res) => {
                    const bits = parseInt(res.trim(), 10);
                    if (bits < this.#bitMin) {
                        alert('Low on random number capacity');
                    }
                });
        }, 5 * 60 * 1000); // every 5 min; top-off is every 10 min
    }

    #getNewNumbers (/** @type {number} */ max) {
        return fetch(`https://www.random.org/integers/?num=${this.#cacheCapacityPerDie}&min=1&max=${max}&col=1&base=10&format=plain&rnd=new`)
            .then((r) => r.text())
            .then((lines) => lines.trimEnd().split('\n').map((n) => parseInt(n, 10)));
    }

    async get (/** @type {number} */ max) {
        let cache = this.#caches.get(max);
        if (cache == null || cache.length === 0) {
            cache = await this.#getNewNumbers(max);
            this.#caches.set(max, cache);
        }
        return cache.pop();
    }
};

/** @returns {Random} */
const randomFactory = (/** @type {'default'|'legacyRO'|'randomOrg'} */ type, /** @type {undefined | { apiKey: string }} */ options) => {
    if (type === 'default') {
        return new Native();
    } else if (type === 'legacyRO') {
        return new LegacyRO();
    } else if (type === 'randomOrg') {
        throw new Error();
    }
    throw new Error();
};

export default randomFactory;
