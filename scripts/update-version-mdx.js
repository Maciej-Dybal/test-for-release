#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

/**
 * Custom script to format the changelog for Version.mdx
 * This script converts semantic-release changelog format to the custom MDX format
 */

const versionMdxPath = path.join(__dirname, "../stories/01. Docs/Version.mdx");

// Read the current Version.mdx file
let content = "";
if (fs.existsSync(versionMdxPath)) {
	content = fs.readFileSync(versionMdxPath, "utf8");
}

// Get the new version and release notes from environment variables
const nextVersion = process.env.NEXT_VERSION;
const releaseNotes = process.env.RELEASE_NOTES;
const releaseDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

if (!nextVersion || !releaseNotes) {
	console.log("No version or release notes found, skipping Version.mdx update");
	process.exit(0);
}

// Format the new entry - convert release notes to custom component format
let formattedNotes = releaseNotes
	.replace(/^# .*?\n/, "") // Remove main heading
	.replace(/^## .*?\n/gm, "") // Remove section headings
	.replace(/^\* /gm, "- ") // Convert asterisk bullets to dash bullets
	.replace(/\([a-f0-9]{7}\)/g, "") // Remove commit hash references
	.replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
	.trim();

// Transform to component-based format with capitalized names and detailed descriptions
formattedNotes = formattedNotes
	.split('\n')
	.map(line => {
		if (line.startsWith('- **')) {
			// Extract component name and description
			const match = line.match(/^- \*\*([^:*]+):\*\* (.+)$/);
			if (match) {
				const componentName = match[1].trim();
				const description = match[2].trim();
				// Capitalize component name and format with detailed description
				const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
				return `- **${capitalizedName}:**\n\t- ${description}`;
			}
		}
		return line;
	})
	.join('\n');

// If no formatted notes, add a generic entry
if (!formattedNotes) {
	formattedNotes = "- Various improvements and bug fixes";
}

// Determine if this is a beta release
const isBeta = nextVersion.includes("-beta");
const versionLabel = isBeta ? `${nextVersion} (Beta - Testing)` : nextVersion;
const releaseLabel = isBeta
	? `${releaseDate} (Beta Testing Release)`
	: releaseDate;

const newEntry = `### Version ${versionLabel}

#### Released on: ${releaseLabel}

${formattedNotes}
`;

// Insert the new entry after the marker
const marker = "{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}";
const newContent = content.replace(marker, `${marker}\n\n${newEntry}`);

// Write the updated content
fs.writeFileSync(versionMdxPath, newContent, "utf8");
console.log(`Updated Version.mdx with version ${nextVersion}`);
