(function() { // don't pollute the environment.

// mark it anyway, so if we have nested iframes,
// we'll still have it set correctly.
window._ciplogic_fast_live_reload = true;

if (parent != window && parent._ciplogic_fast_live_reload) {
	return; // bail out if loaded in the parent iframe.
}
