const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  prompter: function(cz, commit) {
    const types = [
      { value: 'feat', name: 'feat:     A new feature' },
      { value: 'fix', name: 'fix:      A bug fix' },
      { value: 'docs', name: 'docs:     Documentation only changes' },
      { value: 'style', name: 'style:    Changes that do not affect the meaning of the code' },
      { value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature' },
      { value: 'perf', name: 'perf:     A code change that improves performance' },
      { value: 'test', name: 'test:     Adding missing tests or correcting existing tests' },
      { value: 'chore', name: 'chore:    Other changes that don\'t modify src or test files' },
      { value: 'revert', name: 'revert:   Reverts a previous commit' }
    ];

    const scopes = [
      'Button', 'Header', 'Page', 'CategoryTile', 'storybook', 'deps', 'config'
    ];

    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: "Select the type of change that you're committing:",
        choices: types
      },
      {
        type: 'list',
        name: 'scope',
        message: 'What is the scope of this change (e.g. component or file name):',
        choices: scopes.concat(['custom', 'none']),
        filter: function(value) {
          return value === 'none' ? '' : value;
        }
      },
      {
        type: 'input',
        name: 'customScope',
        message: 'Denote the custom scope:',
        when: function(answers) {
          return answers.scope === 'custom';
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: 'Write a short, imperative tense description of the change:',
        validate: function(value) {
          return value.length > 0 ? true : 'Subject is required';
        }
      },
      {
        type: 'input',
        name: 'body',
        message: 'Provide a longer description of the change (optional):'
      },
      {
        type: 'input',
        name: 'versionContent',
        message: 'Add detailed component changes for Version.mdx (optional).\\nFormat: "- **ComponentName:** Description"\\nMultiple lines: use "|" to separate:'
      },
      {
        type: 'input',
        name: 'breaking',
        message: 'List any BREAKING CHANGES (optional):',
        when: function(answers) {
          return ['feat', 'fix'].includes(answers.type);
        }
      },
      {
        type: 'input',
        name: 'footer',
        message: 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:'
      },
      {
        type: 'confirm',
        name: 'confirmCommit',
        message: function(answers) {
          const scope = answers.customScope || answers.scope;
          const scopeStr = scope ? `(${scope})` : '';
          const subject = answers.subject;
          const body = answers.body ? `\\n\\n${answers.body}` : '';
          const breaking = answers.breaking ? `\\n\\nBREAKING CHANGE: ${answers.breaking}` : '';
          const footer = answers.footer ? `\\n\\n${answers.footer}` : '';
          
          return `Are you sure you want to proceed with the commit above?\\n\\n${answers.type}${scopeStr}: ${subject}${body}${breaking}${footer}`;
        },
        default: true
      }
    ]).then(function(answers) {
      if (!answers.confirmCommit) {
        console.log('Commit cancelled.');
        return;
      }

      // Build the commit message
      const scope = answers.customScope || answers.scope;
      const scopeStr = scope ? `(${scope})` : '';
      const subject = answers.subject;
      let body = answers.body || '';
      
      // Add version content to body if provided
      if (answers.versionContent) {
        const versionContent = answers.versionContent.replace(/\\|/g, '\\n');
        body = body ? `${body}\\n\\nVersion.mdx:\\n${versionContent}` : `Version.mdx:\\n${versionContent}`;
      }
      
      const breaking = answers.breaking ? `\\n\\nBREAKING CHANGE: ${answers.breaking}` : '';
      const footer = answers.footer ? `\\n\\n${answers.footer}` : '';
      
      const commitMessage = `${answers.type}${scopeStr}: ${subject}${body ? `\\n\\n${body}` : ''}${breaking}${footer}`;
      
      // If version content is provided, also update Version.mdx
      if (answers.versionContent) {
        updateVersionMdx(answers.versionContent);
      }
      
      commit(commitMessage);
    });
  }
};

function updateVersionMdx(versionContent) {
  try {
    const versionMdxPath = path.join(process.cwd(), 'stories/01. Docs/Version.mdx');
    
    if (!fs.existsSync(versionMdxPath)) {
      console.log('Version.mdx not found, skipping update.');
      return;
    }
    
    const content = fs.readFileSync(versionMdxPath, 'utf8');
    const marker = '{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}';
    
    // Format the content
    const formattedContent = versionContent
      .replace(/\\|/g, '\\n') // Convert | to newlines
      .split('\\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\\n');
    
    const today = new Date().toISOString().split('T')[0];
    const newEntry = `\\n\\n### Version (Upcoming)\\n\\n#### Released on: tbd\\n\\n${formattedContent}\\n`;
    
    const newContent = content.replace(marker, marker + newEntry);
    fs.writeFileSync(versionMdxPath, newContent, 'utf8');
    
    console.log('✓ Version.mdx updated with your content');
    
    // Stage the file
    execSync('git add "stories/01. Docs/Version.mdx"');
    
  } catch (error) {
    console.log('Warning: Could not update Version.mdx:', error.message);
  }
}