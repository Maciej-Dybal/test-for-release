# Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic semantic versioning.

## Automatic Commitizen with Version.mdx Integration

We've enhanced [Commitizen](https://commitizen-tools.github.io/commitizen/) to automatically help you add detailed component changes to Version.mdx while creating conventional commits.

When you use `git commit`, you'll get an interactive prompt that includes:

### Standard Conventional Commit Fields:
1. **Type**: feat, fix, docs, etc.
2. **Scope**: Component/file name
3. **Subject**: Short description
4. **Body**: Longer description (optional)

### NEW: Version.mdx Content Field
5. **Version.mdx Content**: Add detailed component changes directly during commit

### Example Workflow:

```bash
git add .
git commit
# Interactive Commitizen prompt:

? Select the type of change: feat
? What is the scope: Button, Header  
? Short description: add new button variants and improve header navigation
? Longer description: (optional)
? Add detailed component changes for Version.mdx:
- **Button:** Added new size variants (xs, sm, md, lg, xl) with improved styling
- **Header:** Enhanced navigation with dropdown menus and better accessibility

? Breaking changes: (optional)
? Issues closed: #123, #124
? Confirm commit: Yes
```

### What Happens:
1. ✅ **Conventional commit created** with proper format
2. ✅ **Version.mdx automatically updated** with your detailed content  
3. ✅ **File staged and included** in the commit
4. ✅ **Semantic-release picks up both** conventional commit AND detailed content

### Manual Version.mdx Updates

You can still add content manually to `stories/01. Docs/Version.mdx`:

```mdx
## Version history

{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}

### Version 1.2.0 (Upcoming)
#### Released on: tbd
- **ComponentName:** Manual addition before release
```

### Combined Result

When semantic-release runs, it combines:
- **Your detailed component changes** (from Commitizen)
- **Automatic release notes** (from conventional commits)  
- **Manual additions** (from direct file edits)

This gives you rich, detailed version documentation with minimal effort!

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

## Release Branches

This project supports two types of releases:

### Production Releases (main branch)
- **Branch**: `main`
- **Release type**: Stable releases
- **Version format**: `1.2.3`
- **npm tag**: `latest` (default installation)
- **Visibility**: Public
- **GitHub**: Creates public GitHub release

### Beta Releases (test branch) - TESTING ONLY
- **Branch**: `test`
- **Release type**: Pre-release for testing in other repos
- **Version format**: `1.2.3-beta.1`
- **npm tag**: `beta` (requires explicit installation)
- **Visibility**: Available but not default
- **GitHub**: NO GitHub release created
- **Purpose**: Testing in other repositories

### Workflow:
1. **Development**: Work on feature branches
2. **Testing**: Merge to `test` branch for beta releases
3. **Production**: Merge to `main` branch for stable releases

```bash
# Create a beta release for testing
git checkout test
git merge feature-branch
git push origin test
# ↑ Creates version 1.2.3-beta.1 (published with @beta tag)

# Create a stable release
git checkout main
git merge test  # or merge feature directly
git push origin main
# ↑ Creates version 1.2.3 (published as @latest)
```

### Installation:

#### For End Users (Stable):
```bash
# Installs the latest stable version
npm install @Maciej-Dybal/test-for-release
```

#### For Testing (Beta):
```bash
# Installs the latest beta version for testing
npm install @Maciej-Dybal/test-for-release@beta

# Or install a specific beta version
npm install @Maciej-Dybal/test-for-release@1.2.3-beta.1
```

#### Check Available Versions:
```bash
# See all versions including beta
npm view @Maciej-Dybal/test-for-release versions --json

# See beta versions only
npm view @Maciej-Dybal/test-for-release dist-tags
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