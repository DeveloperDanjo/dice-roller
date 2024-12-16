import componentCss from "./componentCss.js";
import Die from "./die.js";

const TEMPLATE = (() => {
    const t = document.createElement('template');
    t.innerHTML = `<div id="root"><div id="dice"></div><div id="total"></div></div>`;
    return t;
})();

const SIDES_CONTAINER_TEMPLATE = (() => {
    const t = document.createElement('template');
    t.innerHTML = `<div class="sides-container"><div class="sub-dice"></div><div class="sub-total"></div><div class="sub-bonus-wrap"><input class="sub-bonus" type="number" pattern="(d|-)+"></div></div>`;
    return t;
})();

const SHARED_CSS = componentCss('./assets/shared.css');
const ROLL_CSS = componentCss('./assets/roll.css');

class Roll extends HTMLElement {
    #shadow;

    /** @type {Map<number, Die[]>} */
    #dice = new Map();

    /** @type {Map<number, number>} */
    #subBonus = new Map();

    #bonus = 0;

    static observedAttributes = /** @type {const} */([]);

    constructor() {
        super();
        this.#shadow = this.attachShadow({ mode: 'closed' });
        this.#shadow.append(TEMPLATE.content.cloneNode(true));

        this.#redraw();

        Promise.all([SHARED_CSS, ROLL_CSS]).then((sheets) => {
            this.#shadow.adoptedStyleSheets = sheets;
        });

        this.#shadow.querySelector('#dice').addEventListener('change', (e) => {
            if (e.target.matches('.sub-bonus')) {
                this.#subBonus.set(e.target._sides, parseInt(e.target.value, 10));
            }
            this.#redraw();
        });

        this.#shadow.querySelector('#dice').addEventListener('click', (e) => {
            if (e.target.matches('.sub-bonus')) {
                e.target.select();
            }
        });
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    adoptedCallback() {
    }

    attributeChangedCallback(/** @type {Roll.observedAttributes[number]} */ name, oldValue, newValue) {
    }

    #redraw() {
        const diceContainer = this.#shadow.querySelector('#dice');
        const orders = [...this.#dice.keys()].sort((a, b) => (a - b));
        let total = 0;

        diceContainer.innerHTML = '';
        for (const sides of orders) {
            const sidesContainer = /** @type {HTMLElement} */(SIDES_CONTAINER_TEMPLATE.content.cloneNode(true));
            const dice = this.#dice.get(sides);
            const sideTotal = dice.reduce((s, d) => (s + d.value), 0);

            sidesContainer.querySelector('.sub-dice').append(...dice);
            sidesContainer.querySelector('.sub-total').innerText = sideTotal.toString();

            const subBonusValue = (this.#subBonus.get(sides) ?? 0);

            if (sides == 2) {
                sidesContainer.querySelector('.sub-total').remove();
                sidesContainer.querySelector('.sub-bonus').remove();
            } else {
                const subBonus = sidesContainer.querySelector('.sub-bonus');
                subBonus.value = subBonusValue.toString();
                subBonus._sides = sides;
            }

            total += sideTotal + subBonusValue;
            diceContainer.append(sidesContainer);
        }

        if (orders.length === 1 && orders[0] === 2) {
            const dice = this.#dice.get(2);
            if (dice.length === 1) {
                this.#shadow.querySelector('#total').innerText = dice[0].value === 1 ? 'H' : 'T';
                return;
            }
        }
        this.#shadow.querySelector('#total').innerText = total.toString();
    }

    addDie(/** @type {number} */ sides, /** @type {'ad' | 'dis' | undefined} */ vantage) {
        const dice = this.#dice.get(sides) ?? [];
        const die = /** @type {Die} */(this.ownerDocument.createElement('qdr-die'));
        die.sides = sides;
        die.setAttribute('rollable', 'rollable');
        if (vantage) {
            die.setAttribute('vantage', vantage);
        }
        die.roll().then(() => this.#redraw());
        dice.push(die);
        this.#dice.set(sides, dice);
        this.#redraw();
    }

    get isEmpty() {
        return [...this.#dice.values()].every((a) => a.length === 0);
    }
}
globalThis.customElements.define('qdr-roll', Roll);

export default Roll;
