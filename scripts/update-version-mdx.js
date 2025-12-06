#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Custom script to format the changelog for Version.mdx
 * Handles both semantic-release automatic notes and manual Version.mdx content from commits
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

// Parse release notes to extract manual Version.mdx content
const lines = releaseNotes.split('\n');
let manualContent = '';
let automaticNotes = [];
let inVersionMdxSection = false;

for (const line of lines) {
  if (line.includes('Version.mdx:')) {
    inVersionMdxSection = true;
    continue;
  }
  
  if (inVersionMdxSection && line.trim().startsWith('-')) {
    manualContent += line + '\n';
  } else {
    inVersionMdxSection = false;
    if (line.trim() && !line.includes('Version.mdx:') && !line.startsWith('#')) {
      automaticNotes.push(line);
    }
  }
}

// Format automatic release notes
let formattedNotes = automaticNotes
  .join('\n')
  .replace(/^## .*?\n/gm, '') // Remove section headings
  .replace(/^\* /gm, '- ') // Convert asterisk bullets to dash bullets
  .trim();

// Combine manual and automatic content
let finalContent = '';
if (manualContent.trim()) {
  finalContent = manualContent.trim();
  if (formattedNotes) {
    finalContent += '\n' + formattedNotes;
  }
} else if (formattedNotes) {
  finalContent = formattedNotes;
} else {
  finalContent = '- Various improvements and bug fixes';
}

// Determine if this is a beta release
const isBeta = nextVersion.includes('-beta');
const versionLabel = isBeta ? `${nextVersion} (Beta - Testing)` : nextVersion;
const releaseLabel = isBeta ? `${releaseDate} (Beta Testing Release)` : releaseDate;

const newEntry = `### Version ${versionLabel}

#### Released on: ${releaseLabel}

${finalContent}
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