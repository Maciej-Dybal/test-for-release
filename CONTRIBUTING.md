# Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic semantic versioning.

## Automatic Commitizen with Git Hooks

We've set up [Husky](https://typicode.github.io/husky/) and [Commitizen](https://commitizen-tools.github.io/commitizen/) to automatically guide you through creating properly formatted commit messages.

When you use `git commit` without a message, Commitizen will automatically start:

```bash
git add .
git commit
# ↑ This will automatically trigger the interactive Commitizen prompt
```

You can also manually trigger Commitizen:

```bash
npm run commit
```

If you provide a commit message directly, the hook won't interfere:

```bash
git commit -m "feat: add new feature"  # This works normally
```

## Manual Commit Message Format

If you prefer to write commit messages manually, use this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers a minor release)
- **fix**: A bug fix (triggers a patch release)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or add `!` after the type to trigger a major release:

```
feat!: remove deprecated API
```

or

```
feat: add new API

BREAKING CHANGE: The old API has been removed
```

## Examples

```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
feat!: change API response format
```

## Version Documentation

### Adding Manual Content to Version.mdx

You can add manual documentation for upcoming features or detailed component changes to `stories/01. Docs/Version.mdx`. 

#### Where to Add Content

Add your content **below** the auto-generated marker but **above** existing version entries:

```mdx
## Version history

{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}

### Version 1.2.0 (Upcoming)

#### Released on: tbd

- **NewComponent:**
  - Added amazing new component with cool features
  - Supports multiple themes and variants

### Version 1.1.147
...
```

#### Content Format

Follow this structure for manual entries:

```mdx
### Version X.X.X

#### Released on: YYYY-MM-DD (or "tbd" for unreleased)

- **ComponentName:**
  - Description of change or feature
  - Additional details if needed
- **AnotherComponent:**
  - Another change description
```

#### Automatic vs Manual Content

- **Automatic**: Semantic-release will add entries based on conventional commits
- **Manual**: Developers can add detailed component-specific documentation
- **Both**: The system preserves both types of content

When semantic-release creates a new version, it will:
1. Generate release notes from conventional commits
2. Insert them after the marker
3. Preserve all existing manual content below