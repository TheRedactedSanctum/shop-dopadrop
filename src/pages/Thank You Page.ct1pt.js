import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    // Wix Reviews builds its review link from submission context. A direct
    // visit has none and otherwise exposes an href="undefined" dead end.
    if (Object.keys(wixLocationFrontend.query || {}).length === 0) {
        wixLocationFrontend.to('/reviews-collection-page');
    }
});
