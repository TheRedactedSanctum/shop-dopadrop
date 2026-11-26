import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';
import { authentication } from 'wix-members-frontend';

// Navigation bridge for the saved Home - portal goblin draft embed.
// Do not replace its source with a shared live asset. Catalogue access is read-only.
$w.onReady(function () {
    let view;
    try { view = $w('#html1'); } catch (_) { /* the legacy embed was removed from the published page */ }
    if (!view || typeof view.onMessage !== 'function') {
        wixLocationFrontend.to('/');
        return;
    }
    async function readAll(collection) {
        let page = await wixData.query(collection).limit(100).find();
        const items = [...page.items];
        const totalCount = page.totalCount;
        while (page.hasNext()) {
            page = await page.next();
            items.push(...page.items);
        }
        return { items, totalCount };
    }
    let catalogPromise;
    const allowedPaths = new Set([
        '/category/desk-workspace-fidgets', '/category/hand-fidgets-spinners',
        '/category/sensory-rings-chains-wearables', '/category/chew-oral-sensory',
        '/category/tactile-textured-sensory', '/category/weighted-deep-pressure',
        '/category/visual-light-stimulation', '/category/auditory-rhythm-tools',
        '/category/focus-calm-tools', '/category/stim-toys-squishies',
        '/category/sensory-kits-bundles', '/category/movement-balance',
        '/category/all-products', '/category/best-sellers', '/category/puzzles-hands-on-play', '/gift-card', '/search',
        '/', '/about', '/contact', '/blog', '/cart-page', '/account-settings', '/shipping-policy', '/refund-policy',
        '/privacy-policy', '/terms-and-conditions', '/accessibility-statement', '/loyalty', '/my-rewards',
        '/rabbit-hole-cave', '/rabbit-hole-forest', '/rabbit-hole-daily', '/event-list', '/reviews-collection-page'
    ]);
    // These are the exact fallback cards embedded in the saved homepage.
    // Keep their links usable before, or if, the catalogue request completes.
    [
        "/product-page/sdd-005-keyboard-fidget-toy-005",
        "/product-page/sdd-001-deformable-fidget-robot-001",
        "/product-page/shop-dopadrop-sdd-061",
        "/product-page/sdd-004-kalimba-thumb-piano-17-tone-kalimba-beginner-004",
        "/product-page/shop-dopadrop-sdd-136",
        "/product-page/sdd-003-high-grade-six-face-picture-wooden-jigsaw-3d-puzzle-toys-children-s-003",
        "/product-page/sdd-021-shining-led-fidget-spinner-021",
        "/product-page/shop-dopadrop-sdd-208"
    ].forEach(path => allowedPaths.add(path));
    function storefrontPath(value) {
        if (typeof value !== 'string' || !value.trim() || value.startsWith('//') || value.includes('\\')) return '';
        try {
            const url = new URL(value, 'https://www.shop--dopadrop.com.au');
            if (url.origin !== 'https://www.shop--dopadrop.com.au') return '';
            if (url.pathname === '/profile/my/profile') return '/account-settings';
            return url.pathname + url.search + url.hash;
        } catch (_) {
            return '';
        }
    }
    function mediaUrl(value) {
        if (!value) return '';
        if (value.startsWith('https://')) return value;
        const match = value.match(/^wix:image:\/\/v1\/([^/]+)/);
        return match ? 'https://static.wixstatic.com/media/' + match[1] : '';
    }
    async function loadCatalogue() {
        const results = await Promise.allSettled([
            readAll('Stores/Products'),
            readAll('Stores/Collections')
        ]);
        if (results[0].status !== 'fulfilled') {
            console.error('Shop-DopaDrop catalogue unavailable:', results[0].reason);
            return { type: 'SHOP_DOPA_CATALOG', products: [], collections: [], error: true };
        }
        const result = results[0].value;
        const items = result.items.filter(product => product.visible !== false);
        const products = items.map(p => ({
            name: p.name,
            price: p.formattedDiscountedPrice || p.formattedPrice || '',
            image: mediaUrl(p.mainMedia),
            url: storefrontPath(p.productPageUrl)
        }));
        products.forEach(p => { if (p.url.startsWith('/product-page/')) allowedPaths.add(p.url); });
        const collections = results[1].status === 'fulfilled'
            ? results[1].value.items.map(c => ({
                name: c.name,
                url: c.slug ? '/category/' + encodeURIComponent(c.slug) : '/category/all-products'
            })) : [];
        collections.forEach(c => allowedPaths.add(c.url));
        const amounts = items.map(p => p.discountedPrice ?? p.price).filter(p => typeof p === 'number' && p > 0);
        return {
            type: 'SHOP_DOPA_CATALOG', loaded: true, products, collections,
            total: items.length,
            minPrice: amounts.length
                ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Math.min(...amounts)) : ''
        };
    }
    view.onMessage(async event => {
        const data = event.data;
        if (data?.type === 'SHOP_DOPA_READY') {
            catalogPromise = catalogPromise || loadCatalogue();
            view.postMessage(await catalogPromise);
        }
        if (data?.type === 'SHOP_DOPA_NAVIGATE') {
            const path = storefrontPath(data.path);
            if (allowedPaths.has(path)) wixLocationFrontend.to(path);
        }
        if (data?.type === 'RABBIT_LOGIN_REQUEST') {
            try {
                if (!authentication.loggedIn()) await authentication.promptLogin();
                if (data.intent === 'account') wixLocationFrontend.to('/account-settings');
                else view.postMessage({ type: 'RABBIT_LOGIN_RESULT', ok: true });
            } catch (error) {
                view.postMessage({ type: 'RABBIT_LOGIN_RESULT', ok: false, error: error?.message || 'LOGIN_CANCELLED' });
            }
        }
    });
});
