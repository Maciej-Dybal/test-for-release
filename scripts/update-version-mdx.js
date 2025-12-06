#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Custom script to format the changelog for Version.mdx
 * This script converts semantic-release changelog format to the custom MDX format
 */

const versionMdxPath = path.join(__dirname, '../stories/01. Docs/Version.mdx');

// Read the current Version.mdx file
let content = '';
if (fs.existsSync(versionMdxPath)) {
  content = fs.readFileSync(versionMdxPath, 'utf8');
}

// Get the new version and release notes from environment variables
const nextVersion = process.env.NEXT_VERSION;
const releaseNotes = process.env.RELEASE_NOTES;
const releaseDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

if (!nextVersion || !releaseNotes) {
  console.log('No version or release notes found, skipping Version.mdx update');
  process.exit(0);
}

// Parse release notes and convert to component-based format
let formattedNotes = releaseNotes
  .replace(/^# .*?\n/, '') // Remove main heading
  .replace(/^## .*?\n/gm, '') // Remove section headings
  .replace(/^\* /gm, '') // Remove asterisk bullets
  .trim();

// Convert to component-based format if not already
if (formattedNotes && !formattedNotes.includes('**')) {
  // If no component specified, use generic format
  formattedNotes = `- **Component:**\n\n\t- ${formattedNotes.replace(/\n/g, '\n\n\t- ')}`;
} else if (formattedNotes) {
  // Ensure proper indentation for existing component format
  formattedNotes = formattedNotes
    .split('\n')
    .map(line => {
      if (line.trim().startsWith('**') && line.includes(':**')) {
        return `- ${line.trim()}`;
      } else if (line.trim().startsWith('-') && !line.includes('**')) {
        return `\n\t${line.trim()}`;
      }
      return line;
    })
    .join('\n');
}

// If no formatted notes, add a generic entry
if (!formattedNotes) {
  formattedNotes = '- **Component:**\n\n\t- Various improvements and bug fixes';
}

// Don't add beta labels - keep version as is
const versionLabel = nextVersion;
const releaseLabel = releaseDate;

const newEntry = `### Version ${versionLabel}

#### Released on: ${releaseLabel}

${formattedNotes}`;

// Insert the new entry after the marker
const marker = '{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}';
const newContent = content.replace(
  marker,
  `${marker}\n\n${newEntry}\n`
);

// Write the updated content
fs.writeFileSync(versionMdxPath, newContent, 'utf8');
console.log(`Updated Version.mdx with version ${nextVersion}`);