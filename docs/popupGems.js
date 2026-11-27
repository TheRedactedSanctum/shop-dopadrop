(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.PopupGems = factory();
}(typeof window !== 'undefined' ? window : this, function () {
    const registry = new Map();
    function attach(panel, options = {}) {
        const doc = panel.ownerDocument;
        const key = String(options.key || options.title || 'popup');
        registry.get(key)?.dispose();
        if (!doc.getElementById('popup-gem-styles')) {
            const style = doc.createElement('style');
            style.id = 'popup-gem-styles';
            style.textContent = '.popup-minimise{z-index:5;min-width:44px;min-height:44px;border:1px solid #aaa!important;border-radius:9px!important;background:#171720!important;color:#fff!important;font:800 25px/1 Arial!important;cursor:pointer}.popup-gem-dock{position:fixed;left:12px;bottom:12px;z-index:10002;display:flex;gap:10px;flex-wrap:wrap;max-width:calc(100vw - 100px)}.popup-gem{position:relative;width:44px;height:44px;clip-path:polygon(50% 0,90% 24%,100% 62%,50% 100%,0 62%,10% 24%);border:0;background:var(--gem-colour);color:#08080d;font-size:19px;font-weight:900;cursor:pointer;filter:drop-shadow(0 0 5px var(--gem-colour))}.popup-gem:focus-visible{outline:4px solid white;outline-offset:4px;clip-path:none}.popup-minimise:focus-visible{outline:3px solid #f5ff37;outline-offset:3px}';
            doc.head.appendChild(style);
        }
        const used = new Set([...registry.values()].map(item => item.slot));
        let index = 0; while (used.has(index)) index += 1;
        // The hunt gem keeps its lime colour. Popup colours use blue through
        // violet through red, with an individual hue for each live popup.
        const hue = Number.isInteger(options.hue) && options.hue >= 190 && options.hue <= 359 ? options.hue : 190 + (index * 43 % 170);
        const gem = doc.createElement('button');
        gem.type = 'button'; gem.className = 'popup-gem'; gem.textContent = '◆'; gem.hidden = true;
        gem.style.setProperty('--gem-colour', `hsl(${hue} 95% 68%)`);
        gem.style.setProperty('--gem-bottom', `${12 + index * 54}px`);
        gem.setAttribute('aria-label', `Restore ${options.title || 'popup'}`);
        gem.title = `Restore ${options.title || 'popup'}`;
        const close = doc.createElement('button');
        close.type = 'button'; close.className = 'popup-minimise'; close.textContent = '×';
        close.setAttribute('aria-label', `X to close: minimise ${options.title || 'popup'} to its gem`);
        close.title = 'X to close — minimise to gem';
        (options.closeParent || panel).prepend(close);
        let dock = doc.getElementById('popup-gem-dock');
        if (!dock) { dock = doc.createElement('div'); dock.id = 'popup-gem-dock'; dock.className = 'popup-gem-dock'; dock.setAttribute('aria-label', 'Minimised popups'); doc.body.appendChild(dock); }
        dock.appendChild(gem);
        let previousFocus = null;
        let minimised = false;
        let display = panel.style.display;
        const minimise = () => {
            if (minimised) return;
            minimised = true;
            previousFocus = doc.activeElement;
            display = panel.style.display;
            panel.style.display = 'none'; gem.hidden = false; gem.focus();
            if (typeof options.onMinimise === 'function') options.onMinimise();
        };
        const restore = () => {
            if (!minimised) return;
            minimised = false;
            panel.style.display = display; gem.hidden = true;
            if (previousFocus && panel.contains(previousFocus)) previousFocus.focus(); else close.focus();
        };
        const onKey = event => { if (event.key === 'Escape' && panel.contains(doc.activeElement)) { event.preventDefault(); minimise(); } };
        close.addEventListener('click', minimise); gem.addEventListener('click', restore); doc.addEventListener('keydown', onKey);
        const control = { slot: index, minimise, restore, gem, close, dispose() { gem.remove(); close.remove(); doc.removeEventListener('keydown', onKey); registry.delete(key); } };
        registry.set(key, control);
        return control;
    }
    return { attach };
}));
