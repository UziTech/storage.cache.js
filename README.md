# storage.cache.js
Add cache to storage.js that refreshes when checked after it expires

# Overview

This extends [storage.js](https://github.com/UziTech/storage.js) to add storage.cache.get/setItem()

When setting a cached item it will be available for a designated amount of time afterwhich `storage.cache.getItem(...)` will return `undefined`.

You can also specify a function to call when the cache expires to refresh the cache and return the refreshed value.

# Install
```html
<script src="/path/to/storage.js"></script>
<script src="/path/to/storage.cache.js"></script>
```

# Usage
```javascript
storage.cache.setItem("a", 1, 1000);

storage.cache.getItem("a");
// before 1 second: 1
// after 1 second: undefined
```
