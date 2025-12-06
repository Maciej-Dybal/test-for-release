# Test for Release

A test project demonstrating automated releases with semantic-release, Storybook components, and GitHub Packages.

## Features

- 🚀 Automated releases with semantic-release
- 📚 Storybook component library
- 📦 Published to GitHub Packages
- ✨ Conventional commits with Commitizen
- 🎣 Git hooks with Husky

## Installation

```bash
npm install @Maciej-Dybal/test-for-release
```

## Development

### Prerequisites

- Node.js 24+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/Maciej-Dybal/test-for-release.git
cd test-for-release

# Install dependencies
npm install

# Start Storybook
npm run storybook
```

### Making Commits

This project uses conventional commits for automated versioning. When you commit, Commitizen will automatically guide you:

```bash
git add .
git commit
# Interactive prompt will appear
```

Or use the manual command:

```bash
npm run commit
```

### Building

```bash
# Build Storybook
npm run build-storybook
```

## Publishing

Releases are automated through GitHub Actions when commits are pushed to the main branch:

- `feat:` commits trigger minor releases
- `fix:` commits trigger patch releases  
- `feat!:` or `BREAKING CHANGE:` trigger major releases

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

ISC