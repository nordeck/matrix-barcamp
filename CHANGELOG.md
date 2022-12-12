# matrix-barcamp-widget

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
