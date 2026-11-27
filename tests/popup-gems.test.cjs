const test = require('node:test');
const assert = require('node:assert/strict');
const { attach } = require('../src/public/popupGems.js');
function documentFixture() {
    const doc = { handlers: {}, activeElement: null, createElement() { return element(); }, addEventListener(key, fn) { (this.handlers[key] ||= []).push(fn); }, removeEventListener(key, fn) { this.handlers[key] = this.handlers[key].filter(x => x !== fn); }, getElementById(id) { return [...all].find(x => x.id === id && !x.removed) || null; } };
    const all = new Set();
    function element() {
        const el = { ownerDocument: doc, style: { display: '', setProperty(k, v) { this[k] = v; } }, children: [], attributes: {}, events: {}, hidden: false,
            appendChild(child) { child.parent = this; this.children.push(child); }, prepend(child) { child.parent = this; this.children.unshift(child); },
            setAttribute(k, v) { this.attributes[k] = v; }, addEventListener(k, fn) { this.events[k] = fn; }, focus() { doc.activeElement = this; },
            contains(child) { return child === this || this.children.some(x => x.contains(child)); }, remove() { this.removed = true; }, click() { this.events.click(); } };
        all.add(el); return el;
    }
    doc.head = element(); doc.body = element(); return { doc, element };
}
test('X minimises to an individual non-hunt-colour gem and restores the same draft, choices and focus', () => {
    const { element } = documentFixture(); const panel = element(); const notes = element(); notes.value = 'An unsaved theory'; panel.appendChild(notes); notes.focus();
    const first = attach(panel, { key: 'tavern-test', title: 'Tavern journal' });
    const second = attach(element(), { key: 'other-test', title: 'Another popup' });
    first.close.click(); first.minimise();
    assert.equal(panel.style.display, 'none'); assert.equal(first.gem.hidden, false);
    assert.notEqual(first.gem.style['--gem-colour'], second.gem.style['--gem-colour']);
    first.gem.click();
    assert.equal(panel.style.display, ''); assert.equal(first.gem.hidden, true);
    assert.equal(notes.value, 'An unsaved theory'); assert.equal(panel.ownerDocument.activeElement, notes);
    first.dispose(); second.dispose();
});
