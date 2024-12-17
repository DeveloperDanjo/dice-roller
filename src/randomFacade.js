/**
 * @typedef {{
 *   get(max: number): Promise<number>;
 *   getCacheSize(max: number): number;
 *   getHisto(max: number): number[];
 *   get name(): string;
 * }} Random
 */

/** @implements {Random} */
class Native {
    /** @type {Map<number, number[]>} */
    #histo = new Map();
    async get (/** @type {number} */ max) {
        const res = 1 + Math.floor(Math.random() * max);
        await navigator.locks.request(`qdr-native-lock-${max}`, async () => {
            if (!this.#histo.has(max)) {
                this.#histo.set(max, (new Array(max)).fill(0));
            }
            this.#histo.get(max)[res - 1]++;
        });
        return res;
    }
    getCacheSize () { return Infinity; }
    getHisto(/** @type {number} */ num) { return this.#histo.get(num); }
    get name() { return 'default'; }
};

/** @implements {Random} */
class LegacyRO {
    #cacheCapacityPerDie = 100;
    #bitMin = 10000;

    /** @type {Map<number, number[]>} */
    #caches = new Map();
    /** @type {Map<number, number[]>} */
    #histo = new Map();

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

    async #getFromCache (/** @type {number} */ max) {
        let res;
        await navigator.locks.request(`qdr-lro-lock-${max}`, async () => {
            let cache = this.#caches.get(max);
            if (cache == null || cache.length === 0) {
                cache = await this.#getNewNumbers(max);
                this.#caches.set(max, cache);
            }
            res = cache.pop();

            if (!this.#histo.has(max)) {
                this.#histo.set(max, (new Array(max)).fill(0));
            }
            this.#histo.get(max)[res - 1]++;
        });
        return res;
    }

    get name() { return 'legacyRO'; }

    get (/** @type {number} */ max) {
        return this.#getFromCache(max);
    }

    getCacheSize (/** @type {number} */ max) {
        return (this.#caches.get(max) ?? []).length;
    }

    getHisto(/** @type {number} */ num) { return this.#histo.get(num); }
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
