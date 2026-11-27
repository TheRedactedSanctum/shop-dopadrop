const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function pageHarness(file, { loggedIn = true, products = [], missingEmbed = false, query = {}, locationPath = [] } = {}) {
    const ready = [], navigated = [], posted = [];
    let listener, prompts = 0;
    const view = { postMessage: message => posted.push(message), onMessage: callback => { listener = callback; } };
    const $w = id => {
        if (id === 'Text') return [];
        if (id === '#html1' && missingEmbed) throw new Error('No such element');
        return id === '#html3' || id === '#html1' ? view : { collapse() {} };
    };
    $w.onReady = callback => ready.push(callback);
    const context = {
        $w, URL, console,
        wixLocationFrontend: { path: locationPath, query, to: route => navigated.push(route) },
        authentication: {
            onLogin() {}, loggedIn: () => loggedIn,
            async promptLogin() { prompts++; }
        },
        wixData: { query: collection => ({ limit: () => ({ find: async () => ({
            items: collection === 'Stores/Products' ? products : [], totalCount: products.length,
            hasNext: () => false
        }) }) }) }
    };
    vm.runInNewContext(read(file).replace(/^import[\s\S]*?;\r?\n/gm, ''), context);
    for (const callback of ready) callback();
    return { posted, navigated, prompts: () => prompts, emit: data => listener({ data }) };
}

test('signed-in Account opens the real member area without another login prompt', async () => {
    const app = pageHarness('src/pages/Home.c1dmp.js');
    await app.emit({ type: 'RABBIT_LOGIN_REQUEST', intent: 'account' });
    assert.equal(app.prompts(), 0);
    assert.deepEqual(app.navigated, ['/account-settings']);
});

test('signed-out Account continues to the member area after Wix login', async () => {
    const app = pageHarness('src/pages/Home.c1dmp.js', { loggedIn: false });
    await app.emit({ type: 'RABBIT_LOGIN_REQUEST', intent: 'account' });
    assert.equal(app.prompts(), 1);
    assert.deepEqual(app.navigated, ['/account-settings']);
});

test('a hunt sign-in refreshes hunt state without navigating away from the hidden button', async () => {
    const app = pageHarness('src/pages/Home.c1dmp.js', { loggedIn: false });
    await app.emit({ type: 'RABBIT_LOGIN_REQUEST' });
    assert.deepEqual(app.navigated, []);
    assert.equal(app.posted.at(-1).type, 'RABBIT_LOGIN_RESULT');
    assert.equal(app.posted.at(-1).ok, true);
});

test('the member gem does not prompt an already signed-in player to log in again', async () => {
    const ready = [], posted = [];
    let listener, prompts = 0;
    const retired = { collapsed: false, collapse() { this.collapsed = true; } };
    const widget = { src: '', expand() {}, show() {}, onMessage(fn) { listener = fn; }, postMessage(message) { posted.push(message); } };
    const $w = id => id === 'Text' || id === 'Section' ? []
        : id === '#html2' ? widget : id === '#rabbitDiscoveryButton' ? retired : { collapse() {}, onMessage() {} };
    $w.onReady = callback => ready.push(callback);
    const context = {
        $w, console,
        wixLocationFrontend: { baseUrl: 'https://www.shop--dopadrop.com.au', to() {} },
        authentication: { loggedIn: () => true, async promptLogin() { prompts++; } },
        getMyRabbitDashboard: async () => ({ progress: { found: 44, required: 50 } })
    };
    vm.runInNewContext(read('src/pages/masterPage.js').replace(/^import .*;\r?\n/gm, ''), context);
    for (const callback of ready) await callback();
    await listener({ data: { type: 'rabbit-hole-action', action: 'sign-in' } });
    assert.equal(prompts, 0);
    assert.equal(posted.at(-1).payload.progress.found, 44);
    assert.equal(retired.collapsed, true);
});

for (const file of ['src/pages/Home.c1dmp.js']) {
    test(`${file}: catalogue absolute URLs navigate through the Wix page router`, async () => {
        const app = pageHarness(file, { products: [{
            name: 'Live product', visible: true, mainMedia: '', price: 12.95,
            productPageUrl: 'https://www.shop--dopadrop.com.au/product-page/live-product'
        }] });
        await app.emit({ type: 'SHOP_DOPA_READY' });
        assert.equal(app.posted[0].products[0].url, '/product-page/live-product');
        await app.emit({ type: 'SHOP_DOPA_NAVIGATE', path: app.posted[0].products[0].url });
        assert.deepEqual(app.navigated, ['/product-page/live-product']);
        await app.emit({ type: 'SHOP_DOPA_NAVIGATE', path: 'https://example.com/product-page/live-product' });
        assert.equal(app.navigated.length, 1);
    });
}

test('a direct review confirmation visit has a real reviews destination', () => {
    const app = pageHarness('src/pages/Thank You Page.ct1pt.js');
    assert.deepEqual(app.navigated, ['/reviews-collection-page']);
});

test('review confirmation with submission context remains owned by Wix Reviews', () => {
    const app = pageHarness('src/pages/Thank You Page.ct1pt.js', { query: { submission: 'provided-by-wix' } });
    assert.deepEqual(app.navigated, []);
});

test('the invalid legacy my-profile alias reaches Account without changing real public profiles', () => {
    const legacy = pageHarness('src/pages/Profile.nqcgq.js', { locationPath: ['profile', 'my', 'profile'] });
    assert.deepEqual(legacy.navigated, ['/account-settings']);
    const profile = pageHarness('src/pages/Profile.nqcgq.js', { locationPath: ['profile', 'member-slug', 'profile'] });
    assert.deepEqual(profile.navigated, []);
});

test('the embedded Account link has a real fallback and identifies account navigation', () => {
    const html = read('src/public/shop-dopadrop-home-current.html');
    const source = html.slice(html.indexOf('function setRouteLinks()'), html.indexOf('\nrender();setRouteLinks();'));
    const sent = [], link = { dataset: { route: '/profile/my/profile' }, removeAttribute() {} };
    const parent = {};
    const context = {
        document: { querySelectorAll: () => [link] },
        window: { parent }, STOREFRONT_ORIGIN: 'https://www.shop--dopadrop.com.au',
        storefrontHref: route => 'https://www.shop--dopadrop.com.au' + route,
        send: message => sent.push(message)
    };
    vm.runInNewContext(source + '\nsetRouteLinks();', context);
    assert.equal(link.href, 'https://www.shop--dopadrop.com.au/account-settings');
    link.onclick({ preventDefault() {} });
    assert.equal(sent[0].intent, 'account');
});

test('missing live product URLs cannot erase a working featured product link', () => {
    const html = read('src/public/shop-dopadrop-home-current.html');
    const source = html.slice(html.indexOf('function render('), html.indexOf('function setRouteLinks()'));
    const nodes = {};
    const makeNode = tag => ({ tag, children: [], dataset: {}, style: { setProperty() {} },
        append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; } });
    const feature = { name: 'Featured product', url: '/product-page/featured-product', image: 'image.jpg', price: 'A$12.95' };
    const context = {
        document: { getElementById: id => nodes[id] ||= makeNode(id) },
        el: makeNode, catalogueFeatures: [feature], themes: []
    };
    vm.runInNewContext(source + '\nrender({ products: [{ name: "Featured product", url: "" }], collections: [] });', context);
    const article = nodes.productsGrid.children[0];
    assert.equal(article.children.at(-1).dataset.route, '/product-page/featured-product');
});
