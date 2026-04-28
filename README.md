# LegacyCoin Mobile Wallet

Mobile wallet for LegacyCoin / LBTC.

This repository is intentionally separate from the core daemon and desktop wallet repository.

## Current status

Phase 1 scaffold:

- React Native / Expo mobile app
- Android project generation support
- iOS project generation support
- Receive screen
- Send screen mock flow
- Balance / transactions screen placeholders
- Configurable LegacyCoin API endpoint placeholder

## Important architecture decision

The mobile wallet is a lightweight wallet. It does **not** bundle the full LegacyCoin node or CPU miner.

Mobile apps should connect to a public LegacyCoin API/RPC gateway instead of running the desktop daemon locally.

## Development

```bash
npm install
npm start
```

## Android

```bash
npm run prebuild:android
npm run android
```

CI can produce an unsigned debug APK artifact.

## iOS

```bash
npm run prebuild:ios
npm run ios
```

CI can produce an unsigned simulator build. Real iOS `.ipa` / TestFlight builds require Apple Developer signing certificates and provisioning profiles.
