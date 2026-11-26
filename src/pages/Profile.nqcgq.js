import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    // "my" is not a real public member slug. Preserve genuine profile routes.
    if (wixLocationFrontend.path.join('/') === 'profile/my/profile') {
        wixLocationFrontend.to('/account-settings');
    }
});
