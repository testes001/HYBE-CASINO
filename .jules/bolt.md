## 2024-05-21 - Memoizing Derived State

**Learning:** I've identified a recurring pattern in the codebase where components re-calculate derived state from props on every render. This can lead to unnecessary performance overhead, especially in components that render frequently or handle large datasets. A prime example is calculating statistics like win/loss rates from a list of game results.

**Action:** I will proactively look for opportunities to apply the `useMemo` hook to memoize these expensive calculations. This will ensure that derived state is only re-computed when its dependencies change, improving the overall performance and efficiency of the components.
