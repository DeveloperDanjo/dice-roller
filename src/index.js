import randomFactory from "./randomFacade.js";
import Die from './die.js';
import Roll from './roll.js';

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
}

/** @typedef {Parameters<typeof randomFactory>[0]} RandomSource */

/** @type {ReturnType<typeof randomFactory>} */
let random;
const updateRandom = (/** @type {RandomSource} */ source) => {
    localStorage.setItem('randomSource', source);
    if (navigator.onLine) {
        random = randomFactory(source);
    } else {
        random = randomFactory('default');
    }

    Die.setRandom(random);
    console.log('updated random to', navigator.onLine ? source : 'default');
};
updateRandom((/** @type {RandomSource} */(localStorage.getItem('randomSource'))) ?? 'default');

window.addEventListener('offline', () => {
    updateRandom((/** @type {RandomSource} */(localStorage.getItem('randomSource'))) ?? 'default');
});
window.addEventListener('online', () => {
    updateRandom((/** @type {RandomSource} */(localStorage.getItem('randomSource'))) ?? 'default');
});

/** @type {HTMLElement} */
const diceTray = document.querySelector('#dice-tray');

/** @type {HTMLElement} */
const results = document.querySelector('#results');

/** @type {number} */
let lastSides = 20;
/** @type {Roll} */;
let lastRoll;

const addNewRoll = () => {
    lastRoll = /** @type {Roll} */(document.createElement('qdr-roll'));
    results.append(lastRoll);
    lastRoll.scrollIntoView({ behavior: 'instant', block: 'end' });;
};
addNewRoll();

diceTray.addEventListener('click', async (e) => {
    const origTarget = /** @type {HTMLElement} */(e.target);

    if (origTarget.matches('#new-roll')) {
        addNewRoll();
        return;
    } else if (origTarget.matches('#clear')) {
        results.innerHTML = '';
        addNewRoll();
        return;
    } else if (!origTarget.matches('qdr-die')) {
        return;
    }

    const sides = parseInt(origTarget.getAttribute('sides'), 10);
    const vantage = /** @type {'ad' | 'dis' | undefined} */(origTarget.getAttribute('vantage') ?? undefined);

    if (!lastRoll.isEmpty && (sides === 20 || lastSides === 20 || lastSides === 2)) {
        addNewRoll();
        lastRoll.addDie(sides, vantage);
    } else {
        lastRoll.addDie(sides, vantage);
    }

    lastSides = sides;
});

(() => {
    /** @type {HTMLDialogElement} */
    const dialog = document.querySelector('#settings-dialog');
    /** @type {HTMLFormElement} */
    const form = dialog.querySelector('#settings-form');
    /** @type {HTMLElement} */
    const trigger = document.querySelector('#settings');

    trigger.addEventListener('click', (e) => {
        dialog.showModal();
    });

    form.addEventListener('change', (e) => {
        /** @type {HTMLInputElement} */
        const target = e.target;

        if (target.name === 'randomSource') {
            updateRandom((/** @type {RandomSource} */(target.value)) ?? 'default');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        dialog.close();
    });
})();
