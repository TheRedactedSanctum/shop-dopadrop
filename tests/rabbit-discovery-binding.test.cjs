const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.resolve(__dirname, '../src/public/rabbitDiscovery.js');

function loadBinder(deps) {
    const source = fs.readFileSync(sourcePath, 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace('export async function bindRabbitDiscovery', 'async function bindRabbitDiscovery')
        .concat('\nglobalThis.bindRabbitDiscovery = bindRabbitDiscovery;');
    const context = { console: { warn() {}, error() {} }, ...deps };
    vm.runInNewContext(source, context);
    return context.bindRabbitDiscovery;
}

function makeButton() {
    const button = {
        label: '',
        classes: new Set(),
        customClassList: {
            add(...names) { names.forEach(name => this.owner.classes.add(name)); },
            remove(...names) { names.forEach(name => this.owner.classes.delete(name)); }
        },
        accessibility: {},
        enabled: true,
        tabIndex: 0,
        collapsed: false,
        collapseCount: 0,
        expandCount: 0,
        clickHandler: null,
        collapse() { this.collapsed = true; this.collapseCount += 1; },
        expand() { this.collapsed = false; this.expandCount += 1; },
        disable() { this.enabled = false; return Promise.resolve(); },
        enable() { this.enabled = true; return Promise.resolve(); },
        onClick(handler) { this.clickHandler = handler; }
    };
    button.customClassList.owner = button;
    return button;
}

function makeImageButton() {
    const element = makeButton();
    delete element.label;
    delete element.disable;
    delete element.enable;
    Object.defineProperty(element, 'label', {
        set() { throw new Error('Image elements do not support button labels'); }
    });
    return element;
}

function makeWixElements(ids) {
    const elements = Object.fromEntries(ids.map(id => [`#${id}`, makeButton()]));
    return {
        elements,
        $w(selector) {
            if (!(selector in elements)) throw new Error(`missing ${selector}`);
            return elements[selector];
        }
    };
}

const aboutSlots = Object.freeze([
    Object.freeze({ buttonId: 32, route: '/about', elementId: 'rabbitDiscovery32' }),
    Object.freeze({ buttonId: 33, route: '/about', elementId: 'rabbitDiscovery33' }),
    Object.freeze({ buttonId: 34, route: '/about', elementId: 'rabbitDiscovery34' })
]);

function baseDeps(overrides = {}) {
    return {
        wixLocationFrontend: { path: ['about'] },
        authentication: { loggedIn: async () => true, promptLogin: async () => {} },
        placementsForRoute: route => route === '/about' ? aboutSlots : [],
        elementIdsForRoute: route => route === '/about'
            ? aboutSlots.map(slot => slot.elementId)
            : [],
        beginButtonChallenge: async buttonId => ({ buttonId, token: `token-${buttonId}` }),
        findButton: async buttonId => ({ newFind: true, found: buttonId - 31, required: 50 }),
        getHuntState: async () => ({ nextButtonId: 32, nextPage: '/about' }),
        ...overrides
    };
}

test('all placed marks remain visible while the next mark advances and saved marks dim', async () => {
    let stateCall = 0;
    const foundCalls = [];
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery33', 'rabbitDiscovery34']);
    const bind = loadBinder(baseDeps({
        getHuntState: async () => (++stateCall === 1
            ? { foundIds: [], nextButtonId: 32, nextPage: '/about' }
            : { foundIds: [32], nextButtonId: 33, nextPage: '/about' }),
        findButton: async (buttonId, route, token) => {
            foundCalls.push([buttonId, route, token]);
            return { newFind: true, found: 32, required: 50 };
        }
    }));

    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(result.buttonId, 32);
    assert.equal(elements['#rabbitDiscovery32'].collapsed, false);
    assert.equal(elements['#rabbitDiscovery33'].collapsed, false);
    assert.equal(elements['#rabbitDiscovery34'].collapsed, false);

    await elements['#rabbitDiscovery32'].clickHandler();
    assert.deepEqual(foundCalls, []);
    assert.equal(elements['#rabbitDiscovery32'].label, 'The mark stirred');
    assert.equal(elements['#rabbitDiscovery32'].classes.has('dopa-discovery-touched'), true);
    await elements['#rabbitDiscovery32'].clickHandler();

    assert.deepEqual(foundCalls, [[32, '/about', 'token-32']]);
    assert.equal(elements['#rabbitDiscovery32'].classes.has('dopa-discovery-found'), true);
    assert.equal(elements['#rabbitDiscovery32'].enabled, false);
    assert.equal(elements['#rabbitDiscovery32'].tabIndex, -1);
    assert.equal(elements['#rabbitDiscovery33'].enabled, true);
    assert.equal(elements['#rabbitDiscovery33'].classes.has('dopa-discovery-next'), true);
    assert.equal(elements['#rabbitDiscovery32'].collapsed, false);
    assert.equal(elements['#rabbitDiscovery33'].collapsed, false);
    assert.equal(elements['#rabbitDiscovery33'].label, 'A Grimroot mark');
    assert.equal(elements['#rabbitDiscovery33'].accessibility.ariaLabel, 'Grimroot Trials discovery 33, next in order');
});

test('binder activates clickable image elements without writing a button label', async () => {
    const image = makeImageButton();
    const elements = { '#rabbitDiscovery32': image };
    const bind = loadBinder(baseDeps({
        placementsForRoute: route => route === '/about' ? [aboutSlots[0]] : [],
        elementIdsForRoute: route => route === '/about' ? ['rabbitDiscovery32'] : []
    }));

    const result = await bind(selector => {
        if (!(selector in elements)) throw new Error(`missing ${selector}`);
        return elements[selector];
    });

    assert.equal(result.bound, true);
    assert.equal(image.collapsed, false);
    assert.equal(image.accessibility.ariaLabel, 'Grimroot Trials discovery 32, next in order');
    assert.equal(typeof image.clickHandler, 'function');
});

test('shared category template collapses every physical slot before binding', async () => {
    const categorySlots = Object.freeze([
        Object.freeze({ buttonId: 8, route: '/category/desk-workspace-fidgets', elementId: 'rabbitDiscoveryHeading' }),
        Object.freeze({ buttonId: 9, route: '/category/desk-workspace-fidgets', elementId: 'rabbitDiscoveryGrid' })
    ]);
    const { elements, $w } = makeWixElements([
        'rabbitDiscoveryHeading', 'rabbitDiscoveryGrid', 'rabbitDiscoveryFooter'
    ]);
    const bind = loadBinder(baseDeps({
        wixLocationFrontend: { path: ['category', 'desk-workspace-fidgets'] },
        placementsForRoute: route => route === '/category/desk-workspace-fidgets' ? categorySlots : [],
        elementIdsForRoute: route => route.startsWith('/category/')
            ? ['rabbitDiscoveryHeading', 'rabbitDiscoveryGrid', 'rabbitDiscoveryFooter']
            : [],
        getHuntState: async () => ({ nextButtonId: 8, nextPage: '/category/desk-workspace-fidgets' })
    }));

    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(elements['#rabbitDiscoveryHeading'].collapsed, false);
    assert.equal(elements['#rabbitDiscoveryGrid'].collapsed, false);
    assert.equal(elements['#rabbitDiscoveryFooter'].collapsed, true);
});

test('unassigned category routes still collapse every shared template slot', async () => {
    const { elements, $w } = makeWixElements([
        'rabbitDiscoveryHeading', 'rabbitDiscoveryGrid', 'rabbitDiscoveryFooter'
    ]);
    const bind = loadBinder(baseDeps({
        wixLocationFrontend: { path: ['category', 'not-in-the-hunt'] },
        placementsForRoute: () => [],
        elementIdsForRoute: route => route.startsWith('/category/')
            ? ['rabbitDiscoveryHeading', 'rabbitDiscoveryGrid', 'rabbitDiscoveryFooter']
            : []
    }));

    const result = await bind($w);
    assert.equal(result.bound, false);
    assert.equal(result.reason, 'NO_DISCOVERY_PLACEMENTS');
    assert.equal(Object.values(elements).every(element => element.collapsed), true);
});

test('a Wix router prefix is included when binding category discoveries', async () => {
    const route = '/category/all-products';
    const categorySlots = [{ buttonId: 5, route, elementId: 'rabbitDiscoveryHeading' }];
    const { elements, $w } = makeWixElements(['rabbitDiscoveryHeading']);
    const bind = loadBinder(baseDeps({
        wixLocationFrontend: { prefix: 'category', path: ['all-products'] },
        placementsForRoute: value => value === route ? categorySlots : [],
        elementIdsForRoute: value => value === route ? ['rabbitDiscoveryHeading'] : [],
        getHuntState: async () => ({ nextButtonId: 5, nextPage: route })
    }));
    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(result.route, route);
    assert.equal(elements['#rabbitDiscoveryHeading'].accessibility.ariaLabel, 'Grimroot Trials discovery 5, next in order');
});

test('a missing future category control does not disable the currently placed discovery', async () => {
    const categorySlots = Object.freeze([
        Object.freeze({ buttonId: 8, route: '/category/desk-workspace-fidgets', elementId: 'rabbitDiscoveryHeading' }),
        Object.freeze({ buttonId: 9, route: '/category/desk-workspace-fidgets', elementId: 'rabbitDiscoveryGrid' })
    ]);
    const { elements, $w } = makeWixElements(['rabbitDiscoveryHeading', 'rabbitDiscoveryGrid']);
    const bind = loadBinder(baseDeps({
        wixLocationFrontend: { path: ['category', 'desk-workspace-fidgets'] },
        placementsForRoute: () => categorySlots,
        elementIdsForRoute: () => [
            'rabbitDiscoveryHeading', 'rabbitDiscoveryGrid', 'rabbitDiscoveryFooter'
        ],
        getHuntState: async () => ({
            nextButtonId: 8,
            nextPage: '/category/desk-workspace-fidgets'
        })
    }));

    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(result.buttonId, 8);
    assert.equal(elements['#rabbitDiscoveryHeading'].collapsed, false);
    assert.equal(elements['#rabbitDiscoveryGrid'].collapsed, false);
});

test('signed-out native routes expose one sign-in slot and activate it after login', async () => {
    let loginPrompts = 0;
    let loggedIn = false;
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery33', 'rabbitDiscovery34']);
    const bind = loadBinder(baseDeps({
        authentication: {
            loggedIn: async () => loggedIn,
            promptLogin: async () => { loginPrompts += 1; loggedIn = true; }
        }
    }));

    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(elements['#rabbitDiscovery32'].collapsed, false);
    assert.match(elements['#rabbitDiscovery32'].label, /Sign in/);
    assert.equal(loginPrompts, 0);
    await elements['#rabbitDiscovery32'].clickHandler();
    assert.equal(loginPrompts, 1);
    assert.equal(elements['#rabbitDiscovery32'].label, 'A Grimroot mark');
});

test('missing current page-local control fails closed with the exact editor ID', async () => {
    const { elements, $w } = makeWixElements(['rabbitDiscovery33', 'rabbitDiscovery34']);
    const bind = loadBinder(baseDeps());

    const result = await bind($w);
    assert.equal(result.bound, false);
    assert.equal(result.reason, 'EDITOR_ELEMENT_MISSING');
    assert.equal(result.missingElementId, 'rabbitDiscovery32');
    assert.equal(Object.values(elements).every(element => element.collapsed), true);
});

test('a missing future page-local control does not disable the current discovery', async () => {
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery34']);
    const bind = loadBinder(baseDeps());

    const result = await bind($w);
    assert.equal(result.bound, true);
    assert.equal(result.buttonId, 32);
    assert.equal(elements['#rabbitDiscovery32'].collapsed, false);
    assert.equal(elements['#rabbitDiscovery34'].collapsed, false);
});

test('obsolete and retired placeholders stay hidden without affecting the active discovery', async () => {
    const { elements, $w } = makeWixElements([
        'rabbitDiscovery32', 'rabbitDiscoveryButton',
        'rabbitDiscoveryRetired1', 'rabbitDiscoveryRetired2'
    ]);
    const result = await loadBinder(baseDeps())($w);
    assert.equal(result.buttonId, 32);
    assert.equal(elements['#rabbitDiscovery32'].collapsed, false);
    for (const id of ['rabbitDiscoveryButton', 'rabbitDiscoveryRetired1', 'rabbitDiscoveryRetired2']) {
        assert.equal(elements[`#${id}`].collapsed, true);
    }
});


test('future and completed marks remain visible without granting another discovery', async () => {
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery33', 'rabbitDiscovery34']);
    let challenges = 0;
    let finds = 0;
    let stateReads = 0;
    const bind = loadBinder(baseDeps({
        getHuntState: async () => {
            stateReads += 1;
            return { foundIds: [32], nextButtonId: 33, nextPage: '/about' };
        },
        beginButtonChallenge: async () => { challenges += 1; },
        findButton: async () => { finds += 1; }
    }));
    await bind($w);
    await elements['#rabbitDiscovery34'].clickHandler();
    const readsBeforeSavedTap = stateReads;
    await elements['#rabbitDiscovery32'].clickHandler();
    assert.equal(stateReads, readsBeforeSavedTap);
    assert.equal(challenges, 0);
    assert.equal(finds, 0);
    assert.equal(Object.values(elements).every(element => !element.collapsed), true);
    assert.equal(elements['#rabbitDiscovery32'].classes.has('dopa-discovery-found'), true);
    assert.equal(elements['#rabbitDiscovery32'].enabled, false);
    assert.equal(elements['#rabbitDiscovery32'].tabIndex, -1);
});

test('saved image marks remain visible but stop keyboard and handler activation', async () => {
    const image = makeImageButton();
    let stateReads = 0;
    const bind = loadBinder(baseDeps({
        placementsForRoute: () => [aboutSlots[0]],
        elementIdsForRoute: () => ['rabbitDiscovery32'],
        getHuntState: async () => {
            stateReads += 1;
            return { foundIds: [32], nextButtonId: 33, nextPage: '/about' };
        },
        beginButtonChallenge: async () => assert.fail('saved image requested a challenge'),
        findButton: async () => assert.fail('saved image requested a discovery')
    }));
    await bind(selector => selector === '#rabbitDiscovery32' ? image : null);
    await image.clickHandler();
    assert.equal(stateReads, 1);
    assert.equal(image.collapsed, false);
    assert.equal(image.tabIndex, -1);
    assert.match(image.accessibility.ariaLabel, /already saved/);
});

test('a fresh authoritative state restores a previously saved mark when it is unfinished', async () => {
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery33', 'rabbitDiscovery34']);
    let state = { foundIds: [32], nextButtonId: 33, nextPage: '/about' };
    const bind = loadBinder(baseDeps({ getHuntState: async () => state }));
    await bind($w);
    assert.equal(elements['#rabbitDiscovery32'].enabled, false);
    state = { foundIds: [], nextButtonId: 32, nextPage: '/about' };
    await bind($w);
    assert.equal(elements['#rabbitDiscovery32'].enabled, true);
    assert.equal(elements['#rabbitDiscovery32'].tabIndex, 0);
    assert.equal(elements['#rabbitDiscovery32'].classes.has('dopa-discovery-found'), false);
});

test('a fast double tap saves the mark while the first tap is still arming it', async () => {
    let issueChallenge;
    const challenge = new Promise(resolve => { issueChallenge = resolve; });
    const foundCalls = [];
    const { elements, $w } = makeWixElements(['rabbitDiscovery32', 'rabbitDiscovery33', 'rabbitDiscovery34']);
    const bind = loadBinder(baseDeps({
        beginButtonChallenge: () => challenge,
        findButton: async (...args) => {
            foundCalls.push(args);
            return { newFind: true, found: 32, required: 50 };
        },
        getHuntState: async () => foundCalls.length
            ? { foundIds: [32], nextButtonId: 33, nextPage: '/about' }
            : { foundIds: [], nextButtonId: 32, nextPage: '/about' }
    }));

    await bind($w);
    const mark = elements['#rabbitDiscovery32'];
    const first = mark.clickHandler();
    await mark.clickHandler();
    assert.deepEqual(foundCalls, []);
    issueChallenge({ token: 'token-32' });
    await first;

    assert.deepEqual(foundCalls, [[32, '/about', 'token-32']]);
    assert.equal(mark.classes.has('dopa-discovery-found'), true);
});
