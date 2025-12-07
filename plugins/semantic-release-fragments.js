const fs = require("node:fs").promises;
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * Semantic Release Plugin for Fragment-based Changelog Generation
 */

const FRAGMENT_DIR = "stories/01. Docs/fragments";
const VERSION_MDX_PATH = "stories/01. Docs/Version.mdx";
const MARKER = "{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}";
const CATEGORY_ORDER = ["Breaking Changes", "Features", "Bugfixes"];

// Category mapping
const CATEGORY_MAP = {
	feat: "Features",
	fix: "Bugfixes",
};

/**
 * Parse conventional commit format
 */
function parseCommit(commit) {
	const firstLine = commit.message.split("\n")[0];
	const match = firstLine.match(/^(\w+)(\([^)]+\))?(!)?:\s*(.+)$/);

	if (!match) return null;

	const [, type, scopeWithParens, breakingMarker, subject] = match;
	const breaking =
		!!breakingMarker || commit.message.includes("BREAKING CHANGE:");

	return {
		type,
		scope: scopeWithParens?.slice(1, -1) || null,
		breaking,
		subject,
		category: breaking ? "Breaking Changes" : CATEGORY_MAP[type] || null,
	};
}

/**
 * Parse fragment file content
 */
function parseFragment(content) {
	const lines = content.split("\n");
	let contentStart = 0;
	let component = null;

	// Parse frontmatter
	if (lines[0] === "---") {
		for (let i = 1; i < lines.length && lines[i] !== "---"; i++) {
			const line = lines[i].trim();
			if (line.startsWith("component:")) {
				component = line.split(":").slice(1).join(":").trim();
			}
		}
		contentStart = lines.findIndex((line, i) => i > 0 && line === "---") + 1;
	}

	return {
		component,
		content: lines.slice(contentStart).join("\n").trim(),
	};
}

/**
 * Get existing fragments in the fragments directory
 */
async function getExistingFragments() {
	try {
		const files = await fs.readdir(FRAGMENT_DIR);
		const fragments = await Promise.all(
			files
				.filter((file) => file.endsWith(".mdx") && file !== "README.md")
				.map(async (file) => {
					try {
						const filePath = path.join(FRAGMENT_DIR, file);
						const content = await fs.readFile(filePath, "utf8");
						return { file: filePath, ...parseFragment(content) };
					} catch {
						return null;
					}
				}),
		);
		return fragments.filter(Boolean);
	} catch {
		return [];
	}
}

/**
 * Generate changelog entry for a component
 */
function generateComponentEntry(component, items) {
	if (!items.length) return "";

	let entry = `- **${component}:**\n`;
	for (const item of items) {
		if (item.content?.trim()) {
			const lines = item.content.split("\n").filter((line) => line.trim());
			entry += `${lines.map((line) => `\t- ${line.trim()}`).join("\n")}\n`;
		} else {
			entry += `\t- ${item.subject}\n`;
		}
	}
	return entry;
}

/**
 * Remove beta versions for the same major.minor from content
 */
function removeBetaVersions(content, stableVersion) {
	const [major, minor] = stableVersion.split('.');
	const betaPattern = new RegExp(
		`### Version ${major}\\.${minor}\\.\\d+-beta\\.\\d+[\\s\\S]*?(?=### Version|$)`,
		'g'
	);
	return content.replace(betaPattern, '').replace(/\n{3,}/g, '\n\n');
}

/**
 * Generate MDX content for the release
 */
function generateMDXContent(nextRelease, changelogData) {
	const releaseDate = new Date().toISOString().split("T")[0];
	let mdxContent = `### Version ${nextRelease.version}\n\n#### Released on: ${releaseDate}`;

	let hasContent = false;
	for (const category of CATEGORY_ORDER) {
		const components = changelogData[category];
		const componentNames = Object.keys(components);

		if (!componentNames.length) continue;

		mdxContent += hasContent ? "\n" : "\n\n";
		mdxContent += `##### ${category}\n\n`;

		for (const [component, items] of Object.entries(components)) {
			const entry = generateComponentEntry(component, items);
			if (entry) {
				mdxContent += entry;
				if (component !== componentNames[componentNames.length - 1]) {
					mdxContent += "\n";
				}
			}
		}
		hasContent = true;
	}

	return mdxContent;
}

/**
 * Main plugin function - runs in prepare lifecycle
 */
async function prepare(_pluginConfig, context) {
	const { nextRelease, commits, logger } = context;

	if (!commits?.length) {
		logger.log("No commits found, skipping fragment processing");
		return;
	}

	logger.log(`Processing ${commits.length} commits for changelog generation`);

	// Get existing fragments and parse commits in parallel
	const [existingFragments, parsedCommits] = await Promise.all([
		getExistingFragments(),
		Promise.resolve(
			commits
				.map(parseCommit)
				.filter(Boolean)
				.filter((c) => c.category),
		),
	]);

	logger.log(`Found ${existingFragments.length} existing fragments`);

	// Initialize changelog data
	const changelogData = Object.fromEntries(
		CATEGORY_ORDER.map((cat) => [cat, {}]),
	);
	const fragmentsToDelete = new Set();

	// Process fragments
	const defaultCategory = parsedCommits[0]?.category || "Features";

	for (const fragment of existingFragments) {
		if (!fragment.content?.trim() || !fragment.component) continue;

		const category = defaultCategory;
		const component = fragment.component;

		if (!changelogData[category][component]) {
			changelogData[category][component] = [];
		}

		changelogData[category][component].push({
			subject: null,
			content: fragment.content,
		});

		fragmentsToDelete.add(fragment.file);
	}

	// Generate and write MDX content
	const mdxContent = generateMDXContent(nextRelease, changelogData);

	try {
		// Read existing content
		let existingContent;
		try {
			existingContent = await fs.readFile(VERSION_MDX_PATH, "utf8");
		} catch {
			existingContent = `## Version history\n\n${MARKER}\n`;
		}

		// If this is a stable release, remove beta versions for the same major.minor
		const isStableRelease = !nextRelease.version.includes('-');
		if (isStableRelease) {
			existingContent = removeBetaVersions(existingContent, nextRelease.version);
		}

		// Update content
		const newContent = existingContent.replace(
			MARKER,
			`${MARKER}\n\n${mdxContent}`,
		);
		await fs.writeFile(VERSION_MDX_PATH, newContent, "utf8");
		logger.log(
			`Updated ${VERSION_MDX_PATH} with changelog for version ${nextRelease.version}`,
		);

		// Clean up fragments and stage changes
		await Promise.all([
			...Array.from(fragmentsToDelete).map(async (fragmentFile) => {
				try {
					await fs.unlink(fragmentFile);
					logger.log(`Deleted processed fragment: ${fragmentFile}`);
				} catch (error) {
					logger.warn(
						`Could not delete fragment ${fragmentFile}: ${error.message}`,
					);
				}
			}),
		]);

		// Stage changes
		try {
			execSync(`git add "${VERSION_MDX_PATH}"`);
			if (fragmentsToDelete.size > 0) {
				for (const fragmentFile of fragmentsToDelete) {
					try {
						execSync(`git add "${fragmentFile}"`);
					} catch {
						// File might already be deleted
					}
				}
			}
			logger.log("Staged changelog updates for semantic-release commit");
		} catch (error) {
			logger.warn(`Could not stage changelog: ${error.message}`);
		}
	} catch (error) {
		logger.error(`Error updating changelog: ${error.message}`);
		throw error;
	}
}

module.exports = { prepare };
