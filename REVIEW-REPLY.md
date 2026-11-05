Thanks! No guard needed: `loadMore` is only passed while no page is loading, and RTK Query
skips `fetchNextPage` while a request for the same list is in flight. `!loadingMore` wouldn't
help anyway, as it comes from the same render. I added a test: three scroll events ask for the
page once.

Memoizing: PrimeReact doesn't memoize on these props, so it wouldn't save anything. I'd keep
them inline.
