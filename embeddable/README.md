# Embeddable Lynx Bundle

Production-ready Lynx bundle and native artifacts to add LynxView to your existing app.

## Contents

- `main.lynx.bundle` — Built Lynx bundle
- `tamer-embeddable.aar` — Android library (Lynx + native modules + bundle)
- `android/` — Gradle project source (for reference or local dependency)
- `ios/` — CocoaPod (podspec + Swift init + bundle)
- `snippet-android.kt` — Android integration snippet
- `Podfile.snippet` — iOS Podfile entries

## Android

```
implementation(files("embeddable/tamer-embeddable.aar"))
```

Call `LynxEmbeddable.init(applicationContext)` before creating views. Use `LynxEmbeddable.buildLynxView(parent)` to embed.

## iOS

Add the `Podfile.snippet` entries to your Podfile, then `pod install`. Initialize `LynxEmbeddable` before presenting LynxView.

## Docs

- [Embedding LynxView](https://lynxjs.org/guide/embed-lynx-to-native)
