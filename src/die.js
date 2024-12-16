import componentCss from "./componentCss.js";

/** @typedef {ReturnType<import('./randomFacade')['default']>} RandomGen */

const TEMPLATE = (() => {
    const t = document.createElement('template');
    t.innerHTML = `<button type="button" class="die"></button>`;
    return t;
})();

const VANTAGE_TEMPLATE = (() => {
    const t = document.createElement('template');
    t.innerHTML = `<button type="button" class="vantage"><div class="die"></div><div class="die"></div></button>`;
    return t;
})();

const SHARED_CSS = componentCss('./assets/shared.css');
const DIE_CSS = componentCss('./assets/die.css');

const CUSTOM_SIDES = {
    2: 'C',
    100: 'P'
};

const COIN = {
    1: 'H',
    2: 'T'
};

class Die extends HTMLElement {
    #shadow;
    /** @type {number} */
    #value;
    /** @type {RandomGen} */
    static #random;

    static observedAttributes = /** @type {const} */(["sides", "value", "rollable", "vantage"]);

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'closed' });

        this.#redraw(true);

        Promise.all([SHARED_CSS, DIE_CSS]).then((sheets) => {
            this.#shadow.adoptedStyleSheets = sheets;
        });
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    adoptedCallback() {
    }

    attributeChangedCallback(/** @type {Die.observedAttributes[number]} */ name, oldValue, newValue) {
        /** @type {NodeListOf<HTMLElement>} */
        const dice = this.#shadow.querySelectorAll('.die');

        switch (name) {
            case 'sides': {
                const numberSides = parseInt(newValue, 10);
                dice.forEach((e) => { e.dataset.sides = newValue; });
                dice.forEach((e) => { e.innerText = (numberSides === 2 ? COIN[this.value] : this.value) ?? CUSTOM_SIDES[newValue] ?? `D${newValue}`; });
                const val = this.value;
                if (val > numberSides) {
                    this.value = numberSides;
                }
                break;
            }
            case 'value': {
                if (oldValue !== newValue) {
                    this.value = parseInt(newValue, 10);
                    dice.forEach((e) => { e.innerText = (this.sides === 2 ? COIN[this.value] : this.value) ?? CUSTOM_SIDES[newValue] ?? `D${newValue}`; });
                }
                break;
            }
            case 'vantage': {
                if (newValue !== oldValue) {
                    this.#redraw();
                }
            }
        }
    }

    get value() {
        return this.#value;
    }
    set value(/** @type {number} */ value) {
        const changed = value !== this.#value;

        this.#value = value;
        this.setAttribute('value', value.toString());

        if (changed) {
            this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
        }
    }

    get sides() {
        return parseInt(this.getAttribute('sides'), 10);
    }
    set sides(/** @type {number} */ sides) {
        this.setAttribute('sides', sides.toString());
    }

    #redraw(/** @type {boolean} */ first = false) {
        const vantage = this.getAttribute('vantage');
        const template = (vantage == null || vantage == '') ? TEMPLATE : VANTAGE_TEMPLATE;
        this.#shadow.innerHTML = '';
        this.#shadow.append(template.content.cloneNode(true));

        /** @type {HTMLButtonElement} */
        const btn = this.#shadow.querySelector('button');
        if (vantage === 'ad') {
            btn.classList.remove('disadvantage');
            btn.classList.add('advantage');
        } else if (vantage === 'dis') {
            btn.classList.add('disadvantage');
            btn.classList.remove('advantage');
        } else {
            btn.classList.remove('advantage', 'disadvantage');
        }

        Die.observedAttributes.forEach((a) => {
            const attr = this.getAttribute(a);
            this.attributeChangedCallback(a, first ? null : attr, attr);
        });

        this.#shadow.querySelector('button').addEventListener('click', () => { this.roll(); });
    }

    async roll() {
        if (!Die.#random || (this.getAttribute('rollable') == null)) { return; }

        const sides = this.getAttribute('sides');
        if (!sides) { return; }

        /** @type {HTMLButtonElement} */
        const btn = this.#shadow.querySelector('button');

        /** @type {HTMLElement[]} */
        const dice = [...this.#shadow.querySelectorAll('.die')];

        const vantage = this.getAttribute('vantage');

        btn.disabled = true;

        const rolls = await Promise.all(dice.map(() => Die.#random.get(parseInt(sides, 10))));
        let roll;

        if (rolls.length === 1) {
            roll = rolls[0];
        } else if (vantage === 'ad') {
            roll = Math.max(...rolls);
        } else if (vantage === 'dis') {
            roll = Math.min(...rolls);
        } else {
            throw new Error();
        }

        this.value = roll;
        btn.disabled = false;

        const numSides = parseInt(sides, 10);
        // do this last so that the call to .value which set all dice the same is undone
        dice.forEach((e, i) => {
            e.innerText = (numSides === 2 ? COIN[rolls[i]] : rolls[i]) ?? CUSTOM_SIDES[sides] ?? `D${sides}`;
        });

        return roll;
    }

    static setRandom(/** @type {RandomGen} */ random) {
        Die.#random = random;
    }
}
globalThis.customElements.define('qdr-die', Die);

export default Die;
