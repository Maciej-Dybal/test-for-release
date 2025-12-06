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
	.replace(/\([a-f0-9]{7}\)/g, "") // Remove commit hash references
	.replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
	.replace(/[A-Z]+-\d+/g, "") // Remove ticket numbers
	.replace(/\(\s*\)/g, "") // Remove empty parentheses
	.trim();

// Parse sections and transform format
const sections = formattedNotes
	.split(/^### /gm)
	.filter((section) => section.trim());
let output = "";

sections.forEach((section) => {
	const lines = section.split("\n").filter((line) => line.trim());
	if (lines.length === 0) return;

	const sectionTitle = lines[0].trim();
	const sectionContent = lines.slice(1);

	// Add section header (Features, BREAKING CHANGES, etc.)
	if (sectionTitle) {
		output += `\n### ${sectionTitle.toUpperCase()}\n\n`;
	}

	let currentComponent = null;
	let currentDescriptions = [];

	sectionContent.forEach((line) => {
		line = line.trim();
		if (!line) return;

		// Handle component lines: * **button:** remove title attr
		const componentMatch = line.match(/^\* \*\*([^:*]+):\*\*\s*(.*)$/);
		if (componentMatch) {
			// Save previous component if exists
			if (currentComponent && currentDescriptions.length > 0) {
				const capitalizedName =
					currentComponent.charAt(0).toUpperCase() + currentComponent.slice(1);
				output += `- **${capitalizedName}:**\n`;
				currentDescriptions.forEach((desc) => {
					output += `\t${desc}\n`;
				});
				output += `\n`; // Add blank line after each component
			}

			currentComponent = componentMatch[1].trim();
			currentDescriptions = [];

			// Handle inline description based on section type
			const inlineDescription = componentMatch[2].trim();
			if (
				inlineDescription &&
				sectionTitle.toUpperCase().includes("BREAKING")
			) {
				// For BREAKING CHANGES, use the inline description (after removing leading dash if present)
				const cleanDesc = inlineDescription.startsWith("- ")
					? inlineDescription.substring(2)
					: inlineDescription;
				currentDescriptions.push(`- ${cleanDesc}`);
			} else if (inlineDescription) {
				// For Features/Bug Fixes, use commit title as description since there are no separate lines
				currentDescriptions.push(`- ${inlineDescription}`);
			}
		}
		// Handle description lines: - Long desc title attr removal
		else if (line.startsWith("- ") && currentComponent) {
			currentDescriptions.push(line); // Keep the full line including the dash
		}
		// Handle indented body text (commit body from Commitizen)
		else if (line.startsWith("  ") && currentComponent) {
			// This is indented body text from the commit
			const bodyText = line.trim();
			if (bodyText) {
				currentDescriptions.push(`- ${bodyText}`);
			}
		}
	});

	// Add the last component
	if (currentComponent && currentDescriptions.length > 0) {
		const capitalizedName =
			currentComponent.charAt(0).toUpperCase() + currentComponent.slice(1);
		output += `- **${capitalizedName}:**\n`;
		currentDescriptions.forEach((desc) => {
			output += `\t${desc}\n`;
		});
		output += `\n`; // Add blank line after the last component too
	}
});

formattedNotes = output.trim();

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
