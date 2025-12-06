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

// Format the new entry - convert release notes to bullet points
let formattedNotes = releaseNotes
  .replace(/^# .*?\n/, '') // Remove main heading
  .replace(/^## .*?\n/gm, '') // Remove section headings
  .replace(/^\* /gm, '- ') // Convert asterisk bullets to dash bullets
  .trim();

// If no formatted notes, add a generic entry
if (!formattedNotes) {
  formattedNotes = '- Various improvements and bug fixes';
}

const newEntry = `### Version ${nextVersion}

#### Released on: ${releaseDate}

${formattedNotes}
`;

// Insert the new entry after the marker
const marker = '{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}';
const newContent = content.replace(
  marker,
  `${marker}\n\n${newEntry}`
);

// Write the updated content
fs.writeFileSync(versionMdxPath, newContent, 'utf8');
console.log(`Updated Version.mdx with version ${nextVersion}`);