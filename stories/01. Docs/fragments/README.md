# Changelog Fragments

This directory contains changelog fragments that provide detailed documentation for changes. The semantic-release plugin will automatically process these fragments and incorporate them into the main `Version.mdx` file.

## How it works

1. **Automatic processing**: Commits are automatically categorized based on conventional commit types
2. **Optional fragments**: Add fragment files for detailed documentation
3. **Flexible content**: Write whatever you want in your fragments - they'll be included exactly as written

## Fragment Format

Create `.mdx` files in this directory with optional frontmatter metadata:

```mdx
---
component: ComponentName
summary: Brief summary (optional)
---

Your detailed changelog content goes here.
Multiple lines are supported.
Each line becomes a bullet point in the final changelog.
```

## Categories

Commits are automatically categorized based on type:
- `feat` → **Features**
- `fix` → **Bugfixes** 
- `!` or `BREAKING CHANGE:` → **Breaking Changes**
- Other types → **Improvements**

## Examples

### Simple commit (no fragment needed)
```bash
git commit -m "fix(button): resolve hover state issue"
```
Result: "Resolve hover state issue" under Bugfixes → Button

### Detailed documentation with fragment
```bash
git commit -m "feat(button): add new accessibility features"
```

Plus create `button-accessibility.mdx`:
```mdx
---
component: Button
---

Enhanced focus indicators for better keyboard navigation
Added comprehensive ARIA labels for screen readers
Improved color contrast ratios to meet WCAG 2.1 AA standards
```

## Best Practices

- Use fragments for significant changes that need detailed explanation
- Write clear, user-focused descriptions
- Use present tense ("Add", "Fix", "Improve")
- Focus on the benefit to users, not implementation details
- One fragment per logical change (can span multiple commits)

## Automatic Cleanup

Processed fragments are automatically deleted after being incorporated into the changelog to prevent duplication in future releases.