module.exports = {
  types: {
    feat: {
      description: 'A new feature',
      title: 'Features'
    },
    fix: {
      description: 'A bug fix',
      title: 'Bug Fixes'
    },
    docs: {
      description: 'Documentation only changes',
      title: 'Documentation'
    },
    style: {
      description: 'Changes that do not affect the meaning of the code',
      title: 'Styles'
    },
    refactor: {
      description: 'A code change that neither fixes a bug nor adds a feature',
      title: 'Code Refactoring'
    },
    perf: {
      description: 'A code change that improves performance',
      title: 'Performance Improvements'
    },
    test: {
      description: 'Adding missing tests or correcting existing tests',
      title: 'Tests'
    },
    build: {
      description: 'Changes that affect the build system or external dependencies',
      title: 'Builds'
    },
    ci: {
      description: 'Changes to our CI configuration files and scripts',
      title: 'Continuous Integrations'
    },
    chore: {
      description: "Other changes that don't modify src or test files",
      title: 'Chores'
    },
    revert: {
      description: 'Reverts a previous commit',
      title: 'Reverts'
    }
  },
  scopes: [
    { name: 'Button' },
    { name: 'Header' },
    { name: 'Page' },
    { name: 'CategoryTile' },
    { name: 'storybook' },
    { name: 'deps' },
    { name: 'config' }
  ],
  messages: {
    type: "Select the type of change that you're committing:",
    scope: 'What is the scope of this change (e.g. component or file name):',
    customScope: 'Denote the custom scope:',
    subject: 'Write a short, imperative tense description of the change:',
    body: 'Provide a longer description of the change (optional). Use "|" to break new line:',
    breaking: 'List any BREAKING CHANGES (optional):',
    footer: 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:',
    confirmCommit: 'Are you sure you want to proceed with the commit above?'
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: [],
  subjectLimit: 100,
  breaklineChar: '|',
  footerPrefix: '',
  askForBreakingChangeFirst: true
};