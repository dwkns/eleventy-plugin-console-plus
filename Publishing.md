# Publishing eleventy-plugin-console-plus to npm

This guide covers how to publish this plugin to npm, including standard releases, versioning, and prerelease (alpha/beta) workflows.

---

## Standard Publishing Workflow

1. **Login to npm (if you haven't already):**
   ```bash
   npm login
   ```

2. **Check your current version:**
   ```bash
   npm version
   # or
   cat package.json | grep version
   ```

3. **Update your code and tests.**

4. **Update the version number:**
   - **Patch release** (bugfix):
     ```bash
     npm version patch
     # e.g. 1.2.3 → 1.2.4
     ```
   - **Minor release** (new features, backward compatible):
     ```bash
     npm version minor
     # e.g. 1.2.3 → 1.3.0
     ```
   - **Major release** (breaking changes):
     ```bash
     npm version major
     # e.g. 1.2.3 → 2.0.0
     ```
   This updates `package.json`, `package-lock.json`, creates a git commit and tag.

5. **Publish to npm:**
   ```bash
   npm publish
   ```
   By default, this publishes to the `latest` tag.

---

## Publishing an Alpha/Prerelease Version

To publish a prerelease (e.g. alpha, beta) without affecting users who install with `npm install <package>`:

### 1. **Bump to a prerelease version**

- **Alpha for next major:**
  ```bash
  npm version premajor --preid=alpha
  # e.g. 1.2.3 → 2.0.0-alpha.0
  ```
- **Alpha for next minor:**
  ```bash
  npm version preminor --preid=alpha
  # e.g. 1.2.3 → 1.3.0-alpha.0
  ```
- **Alpha for next patch:**
  ```bash
  npm version prepatch --preid=alpha
  # e.g. 1.2.3 → 1.2.4-alpha.0
  ```

### 2. **Publish with a tag (e.g. `next`)**

```bash
npm publish --tag next
```
- This ensures users running `npm install eleventy-plugin-console-plus` get the latest stable, not your alpha.
- Testers can install with:
  ```bash
  npm install eleventy-plugin-console-plus@next
  ```

### 3. **Bump the prerelease version**

To increment the prerelease (e.g. alpha.0 → alpha.1):
```bash
npm version prerelease
# e.g. 2.0.0-alpha.0 → 2.0.0-alpha.1
```
Then publish again with:
```bash
npm publish --tag next
```

### 4. **Promote prerelease to stable**

When ready for a stable release:
```bash
npm version major   # or minor/patch as appropriate
npm publish         # publishes as latest
```

### 5. **Remove the prerelease tag**

After publishing the stable version, remove the `next` tag:
```bash
npm dist-tag rm eleventy-plugin-console-plus next
```

---

## Summary Table

| Action                        | Command Example                                 |
|-------------------------------|-------------------------------------------------|
| Patch release                 | `npm version patch`                             |
| Minor release                 | `npm version minor`                             |
| Major release                 | `npm version major`                             |
| Alpha premajor                | `npm version premajor --preid=alpha`            |
| Alpha preminor                | `npm version preminor --preid=alpha`            |
| Alpha prepatch                | `npm version prepatch --preid=alpha`            |
| Bump alpha/beta prerelease    | `npm version prerelease`                        |
| Publish stable                | `npm publish`                                   |
| Publish prerelease (next tag) | `npm publish --tag next`                        |
| Remove prerelease tag         | `npm dist-tag rm eleventy-plugin-console-plus next` |

---

## References
- [How to Prerelease an npm Package (Cloud Four)](https://cloudfour.com/thinks/how-to-prerelease-an-npm-package/)
- [npm version docs](https://docs.npmjs.com/cli/v10/commands/npm-version)
- [npm publish docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)
