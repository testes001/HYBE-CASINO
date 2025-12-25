## 2024-07-25 - Recurring Derived State Calculation
**Learning:** Found a recurring performance pattern where components re-calculate derived state from props on every render (e.g., filtering lists, calculating stats). This is inefficient, especially as data grows or renders become more frequent. Components like `GameHistory.tsx` and `RecentResults.tsx` exhibit this.
**Action:** Apply `useMemo` to memoize these expensive calculations. The dependency array should include the props and state variables that influence the calculation to ensure it only re-runs when necessary.
