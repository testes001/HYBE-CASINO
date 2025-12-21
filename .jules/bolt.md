## 2024-05-22 - Frontend Verification Blocked by Wallet Extension

**Learning:** The application's `sats-connect` library for wallet integration requires a real browser wallet extension to function. This prevents headless browsers like Playwright from interacting with any UI behind the wallet connection wall, making automated frontend verification impossible for most of the application.

**Action:** For future frontend changes, I will first assess if the affected components are accessible without a wallet connection. If not, I will skip the Playwright verification step and rely on unit tests and manual verification notes in the PR.
