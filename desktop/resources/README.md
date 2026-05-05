# Desktop Runtime Resources

Place platform sidecars here before running `bun run prepare:resources`.

For the current platform, the helper scripts can create these folders:

```bash
bun run prepare:mcp
bun run prepare:java-runtime
bun run prepare:pocketbase
```

`prepare:java-runtime` requires a Java 17+ JDK with `jlink` and `jdeps` available. `prepare:pocketbase` downloads the official PocketBase release for the current platform; override the version with `POCKETBASE_VERSION=...`.

Expected layout:

```text
resources/
  pocketbase/
    darwin-arm64/pocketbase
    darwin-x64/pocketbase
    win32-x64/pocketbase.exe
    linux-x64/pocketbase
  java-runtime/
    darwin-arm64/bin/java
    darwin-x64/bin/java
    win32-x64/bin/java.exe
    linux-x64/bin/java
```

The prepare script copies these into `desktop/dist/resources/`. Mutable PocketBase data is never stored here; it lives in the user's app-data directory at runtime.
