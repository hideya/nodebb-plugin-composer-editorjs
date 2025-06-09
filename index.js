'use strict';

const plugin = module.exports;

// Note: Removed server-side MD→JSON conversion - now handled client-side
// This creates a symmetric architecture where both conversions happen on the client:
// - JSON→MD: Client-side (simple object mapping, lightweight)
// - MD→JSON: Client-side (unified/remark-parse, cached by browser)
//
// Benefits of client-side approach:
// - Symmetric architecture: Both conversions in same environment
// - Reduced server processing: No markdown parsing load
// - Better caching: Libraries cached by ServiceWorker/browser
// - Offline capability: Could work without server dependency
// - Simpler server code: Just storage, no conversion logic

// No hooks needed - all conversion now handled client-side



