# matrix-barcamp-widget

## 1.2.0

### Minor Changes

- 69065f5: Sign the release containers with cosign.

## 1.1.0

### Minor Changes

- 439247e: Use event relations to read topic submissions.
- 3b2c59f: Include `arm64` and `s390x` builds.

### Patch Changes

- 3b2c59f: Fix personal area not being shared among users on the same device.
- 3b2c59f: Use of "track" instead of "room" to avoid confusion between matrix rooms and barcamp tracks.
- 3b2c59f: Fix spelling errors in the German translation

## 1.0.1

### Patch Changes

- 981d732: Include a `licenses.json` in the container image, which includes a list of all dependencies and their licenses.
- 33cfb7c: Include `LICENSE` file in container output and define concluded licenses in case of dual licenses.

## 1.0.0

### Major Changes

- 11424c2: Make sure that users can see the history after installing the barcamp when they join later.

### Minor Changes

- 16a7c07: Show a warning if the BarCamp widget is used together with End-to-end encrypted rooms.
  This can cause issues as participants that join the BarCamp later might not be able to see all events in encrypted rooms.
