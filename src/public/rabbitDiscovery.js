import wixLocationFrontend from 'wix-location-frontend';
import { authentication } from 'wix-members-frontend';
import { beginButtonChallenge, findButton, getHuntState } from 'backend/rabbitHole.web';
import { elementIdsForRoute, placementsForRoute } from 'public/rabbitPlacementSlots';

function currentRoute() {
    const parts = Array.isArray(wixLocationFrontend.path)
        ? wixLocationFrontend.path.filter(Boolean)
        : [];
    // Wix excludes a dynamic/router page's prefix from location.path.
    // The placement registry and server challenges use the complete route.
    const prefix = wixLocationFrontend.prefix;
    if (prefix && parts[0] !== prefix) parts.unshift(prefix);
    const path = parts.join('/');
    return path ? `/${path}` : '/';
}

function optionalElement($w, id) {
    try { return $w(id); } catch (_) { return null; }
}

function statusElementId(elementId) {
    return elementId.replace(/^rabbitDiscovery/, 'rabbitDiscoveryStatus');
}

export async function bindRabbitDiscovery($w, options = {}) {
    for (const id of ['rabbitDiscoveryButton', 'rabbitDiscoveryRetired1', 'rabbitDiscoveryRetired2']) {
        const retired = optionalElement($w, `#${id}`);
        if (typeof retired?.collapse === 'function') retired.collapse();
    }
    const route = currentRoute();
    const placements = placementsForRoute(route);
    const physicalButtons = new Map(elementIdsForRoute(route).map(elementId => [
        elementId, optionalElement($w, `#${elementId}`)
    ]));
    physicalButtons.forEach(button => button?.collapse());
    if (!placements.length) return { bound: false, reason: 'NO_DISCOVERY_PLACEMENTS', route };

    const slots = placements.map(placement => ({
        ...placement,
        button: physicalButtons.get(placement.elementId),
        status: optionalElement($w, `#${statusElementId(placement.elementId)}`)
    }));
    slots.forEach(slot => {
        slot.button?.customClassList?.add('dopa-discovery', `dopa-discovery-${slot.buttonId}`);
    });
    const challenges = new Map();
    const foundIds = new Set();
    let activeButtonId = null;
    let lastState = null;
    let inFlight = false;
    let armingButtonId = null;
    let secondTapQueued = false;
    const collapseAll = () => slots.forEach(slot => slot.button?.collapse());
    const setStatus = (slot, message) => {
        if (slot.status) slot.status.text = message;
    };
    const setLabel = (slot, label) => {
        if (slot && typeof slot.button.label === 'string') slot.button.label = label;
    };
    const setInteractive = (slot, interactive) => {
        if (!slot?.button) return;
        // Some original marks are Images, so also guard their handler and tab stop.
        if (interactive) slot.button.enable?.();
        else slot.button.disable?.();
        if ('tabIndex' in slot.button) slot.button.tabIndex = interactive ? 0 : -1;
    };
    const expose = (slot, label, ariaLabel) => {
        collapseAll();
        slots.forEach(candidate => candidate.button?.customClassList?.remove('dopa-discovery-next', 'dopa-discovery-found', 'dopa-discovery-touched'));
        slot?.button.customClassList?.add('dopa-discovery-touched');
        setInteractive(slot, true);
        setLabel(slot, label);
        if (slot?.button.accessibility && ariaLabel) slot.button.accessibility.ariaLabel = ariaLabel;
        slot?.button.expand();
        return slot;
    };
    const activate = nextState => {
        lastState = nextState;
        foundIds.clear();
        (nextState?.foundIds || []).forEach(id => foundIds.add(Number(id)));
        activeButtonId = null;
        challenges.clear();
        slots.forEach(slot => {
            if (!slot.button) return;
            const found = foundIds.has(slot.buttonId);
            setInteractive(slot, !found);
            const next = !found && slot.buttonId === nextState?.nextButtonId && nextState.nextPage === route;
            slot.button.customClassList?.remove('dopa-discovery-next', 'dopa-discovery-found', 'dopa-discovery-touched');
            if (found) slot.button.customClassList?.add('dopa-discovery-found');
            if (next) {
                activeButtonId = slot.buttonId;
                slot.button.customClassList?.add('dopa-discovery-next');
            }
            setLabel(slot, found ? 'Grimroot mark saved' : 'A Grimroot mark');
            if (slot.button.accessibility) slot.button.accessibility.ariaLabel = found
                ? `Grimroot Trials discovery ${slot.buttonId}, already saved`
                : `Grimroot Trials discovery ${slot.buttonId}${next ? ', next in order' : ', waiting for earlier discoveries'}`;
            slot.button.expand();
        });
        return slots.find(slot => slot.buttonId === activeButtonId) || null;
    };

    const availableSlots = slots.filter(slot => slot.button);
    if (!availableSlots.length) {
        return { bound: false, reason: 'EDITOR_ELEMENT_MISSING', missingElementId: slots[0]?.elementId, route };
    }
    const signInSlot = () => expose(availableSlots[0], 'Sign in to enter The Grimroot Trials', 'Sign in to enter The Grimroot Trials');
    const retrySlot = (preferred, message) => {
        activeButtonId = null;
        challenges.clear();
        const slot = preferred?.button && !foundIds.has(preferred.buttonId)
            ? preferred
            : availableSlots.find(candidate => !foundIds.has(candidate.buttonId));
        // A failed refresh must not turn a saved discovery into a retry button.
        if (!slot) return null;
        if (lastState) {
            availableSlots.forEach(candidate => {
                candidate.button.customClassList?.remove('dopa-discovery-next', 'dopa-discovery-touched');
                candidate.button.expand();
            });
            slot.button.customClassList?.add('dopa-discovery-touched');
            setInteractive(slot, true);
            setLabel(slot, 'Retry loading The Grimroot Trials');
        } else expose(slot, 'Retry loading The Grimroot Trials', 'Retry loading The Grimroot Trials');
        setStatus(slot, message);
        return slot;
    };
    const refresh = async () => {
        challenges.clear();
        if (!(await authentication.loggedIn())) {
            activeButtonId = null;
            foundIds.clear();
            lastState = null;
            return signInSlot();
        }
        const state = await getHuntState();
        const requiredSlot = state?.nextPage === route
            ? slots.find(slot => slot.buttonId === state.nextButtonId)
            : null;
        if (requiredSlot && !requiredSlot.button) {
            collapseAll();
            return { error: 'EDITOR_ELEMENT_MISSING', missingElementId: requiredSlot.elementId };
        }
        return activate(state);
    };

    availableSlots.forEach(slot => {
        const handleTap = async () => {
            if (foundIds.has(slot.buttonId)) return;
            if (inFlight) {
                if (armingButtonId === slot.buttonId) secondTapQueued = true;
                return;
            }
            inFlight = true;
            if (activeButtonId === slot.buttonId && !challenges.has(slot.buttonId)) armingButtonId = slot.buttonId;
            try {
                if (!(await authentication.loggedIn())) {
                    await authentication.promptLogin();
                    await refresh();
                    return;
                }
                if (activeButtonId !== slot.buttonId) {
                    await refresh();
                    setStatus(slot, foundIds.has(slot.buttonId)
                        ? 'This discovery is already saved.'
                        : 'Follow the illuminated marks in order. Open the gem for your next step.');
                    return;
                }
                const challenge = challenges.get(slot.buttonId);
                if (!challenge) {
                    const issued = await beginButtonChallenge(slot.buttonId, route);
                    challenges.set(slot.buttonId, { ...issued, readyAt: Date.now() + (issued.waitMs || 0) });
                    setLabel(slot, 'The mark stirred');
                    slot.button.customClassList?.add('dopa-discovery-touched');
                    setStatus(slot, 'The mark stirred.');
                    return;
                }
                const wait = challenge.readyAt - Date.now();
                if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
                const result = await findButton(slot.buttonId, route, challenge.token);
                challenges.delete(slot.buttonId);
                setStatus(slot, result.caveUnlocked
                    ? 'All 50 discoveries are complete. Tanglebright is waiting.'
                    : `Discovery ${result.found} of ${result.required} saved.`);
                const nextState = await getHuntState();
                activate(nextState);
                if (typeof options.onFound === 'function') await options.onFound(result, nextState);
            } catch (error) {
                retrySlot(slot, String(error?.message || error));
            } finally {
                const submitQueuedTap = secondTapQueued && challenges.has(slot.buttonId);
                armingButtonId = null;
                secondTapQueued = false;
                inFlight = false;
                if (submitQueuedTap) await handleTap();
            }
        };
        slot.button.onClick(handleTap);
    });

    if (typeof authentication.onLogin === 'function') authentication.onLogin(() => {
        if (!inFlight) refresh().catch(error => retrySlot(null, String(error?.message || error)));
    });

    try {
        const activeSlot = await refresh();
        if (activeSlot?.error) {
            return {
                bound: false,
                reason: activeSlot.error,
                missingElementId: activeSlot.missingElementId,
                route
            };
        }
        return { bound: true, buttonId: activeButtonId, route };
    } catch (error) {
        retrySlot(null, 'Hunt state unavailable. Your saved progress has not been changed.');
        return { bound: true, buttonId: null, route };
    }
}
