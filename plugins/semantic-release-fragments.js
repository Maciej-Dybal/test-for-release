const fs = require("node:fs").promises;
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * Semantic Release Plugin for Fragment-based Changelog Generation
 */

const FRAGMENT_DIR = "stories/01. Docs/fragments";
const VERSION_MDX_PATH = "stories/01. Docs/Version.mdx";

/**
 * Parse conventional commit format
 */
function parseCommit(commit) {
	const message = commit.message;
	const firstLine = message.split("\n")[0];

	// Match conventional commit: type(scope): subject
	const match = firstLine.match(/^(\w+)(\([^)]+\))?(!)?:\s*(.+)$/);

	if (!match) return null;

	const [, type, scopeWithParens, breakingMarker, subject] = match;
	const scope = scopeWithParens ? scopeWithParens.slice(1, -1) : null;
	const breaking = !!breakingMarker || message.includes("BREAKING CHANGE:");

	return {
		type,
		scope,
		breaking,
		subject,
		hash: commit.hash,
	};
}

/**
 * Get category from commit type
 */
function getCategory(parsedCommit) {
	if (parsedCommit.breaking) return "Breaking Changes";
	if (parsedCommit.type === "feat") return "Features";
	if (parsedCommit.type === "fix") return "Bugfixes";
	return null; // Other types should not be considered
}

/**
 * Parse fragment file content
 */
function parseFragment(content) {
	const lines = content.split("\n");
	const metadata = {};
	let contentStart = 0;

	// Parse frontmatter
	if (lines[0] === "---") {
		let i = 1;
		while (i < lines.length && lines[i] !== "---") {
			const line = lines[i].trim();
			if (line) {
				const [key, ...valueParts] = line.split(":");
				if (key && valueParts.length > 0) {
					metadata[key.trim()] = valueParts.join(":").trim();
				}
			}
			i++;
		}
		contentStart = i + 1;
	}

	const content_lines = lines.slice(contentStart);
	return {
		component: metadata.component,
		content: content_lines.join("\n").trim(),
	};
}

/**
 * Get existing fragments in the fragments directory
 */
async function getExistingFragments() {
	try {
		const files = await fs.readdir(FRAGMENT_DIR);
		const fragments = [];

		for (const file of files) {
			if (file.endsWith(".mdx") && file !== "README.md") {
				const filePath = path.join(FRAGMENT_DIR, file);
				try {
					const content = await fs.readFile(filePath, "utf8");
					const fragment = parseFragment(content);
					fragments.push({
						file: filePath,
						...fragment,
					});
				} catch (_error) {
					// Skip files that can't be read
				}
			}
		}

		return fragments;
	} catch (_error) {
		return [];
	}
}

/**
 * Generate changelog entry for a component
 */
function generateComponentEntry(component, items) {
	if (items.length === 0) return "";

	let entry = `- **${component}:**\n`;

	for (const item of items) {
		if (item.content?.trim()) {
			// Use fragment content
			const lines = item.content.split("\n").filter((line) => line.trim());
			for (const line of lines) {
				entry += `\t- ${line.trim()}\n`;
			}
		} else {
			// Use commit subject
			entry += `\t- ${item.subject}\n`;
		}
	}

	return entry;
}

/**
 * Main plugin function - runs in prepare lifecycle
 */
async function prepare(_pluginConfig, context) {
	const { nextRelease, commits, logger } = context;

	if (!commits || commits.length === 0) {
		logger.log("No commits found, skipping fragment processing");
		return;
	}

	logger.log(`Processing ${commits.length} commits for changelog generation`);

	// Get existing fragments
	const existingFragments = await getExistingFragments();
	logger.log(`Found ${existingFragments.length} existing fragments`);

	// Process commits
	const changelogData = {
		"Breaking Changes": {},
		Features: {},
		Bugfixes: {},
	};

	const fragmentsToDelete = new Set();

	// Process commits to determine what categories we need
	const commitsInRelease = [];
	for (const commit of commits) {
		const parsedCommit = parseCommit(commit);
		if (parsedCommit) {
			const category = getCategory(parsedCommit);
			if (category) {
				commitsInRelease.push({
					...parsedCommit,
					category,
				});
			}
		}
	}

	// Process existing fragments based on commit categories
	for (const fragment of existingFragments) {
		if (fragment.content && fragment.component) {
			const component = fragment.component;

			// Find if there's a commit that could relate to this fragment
			// For now, we'll use the first valid category from commits in this release
			// You could extend this logic to match fragments to specific commits
			const category =
				commitsInRelease.length > 0 ? commitsInRelease[0].category : "Features";

			if (!changelogData[category][component]) {
				changelogData[category][component] = [];
			}

			changelogData[category][component].push({
				subject: null,
				content: fragment.content,
			});

			fragmentsToDelete.add(fragment.file);
		}
	}

	// Generate MDX content
	const releaseDate = new Date().toISOString().split("T")[0];
	let mdxContent = `### Version ${nextRelease.version}\n\n#### Released on: ${releaseDate}\n\n`;

	// Add categories in specific order
	const categoryOrder = ["Breaking Changes", "Features", "Bugfixes"];

	for (const category of categoryOrder) {
		const components = changelogData[category];
		const componentNames = Object.keys(components);

		if (componentNames.length === 0) continue;

		mdxContent += `**${category}**\n\n`;

		for (const [component, items] of Object.entries(components)) {
			const entry = generateComponentEntry(component, items);
			if (entry) {
				mdxContent += `${entry}\n`;
			}
		}
	}

	// Update Version.mdx file
	try {
		let existingContent = "";
		try {
			existingContent = await fs.readFile(VERSION_MDX_PATH, "utf8");
		} catch (_error) {
			existingContent =
				"## Version history\n\n{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}\n";
		}

		const marker = "{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}";
		const newContent = existingContent.replace(
			marker,
			`${marker}\n\n${mdxContent}`,
		);

		await fs.writeFile(VERSION_MDX_PATH, newContent, "utf8");
		logger.log(
			`Updated ${VERSION_MDX_PATH} with changelog for version ${nextRelease.version}`,
		);

		// Delete processed fragments
		for (const fragmentFile of fragmentsToDelete) {
			try {
				await fs.unlink(fragmentFile);
				logger.log(`Deleted processed fragment: ${fragmentFile}`);
			} catch (error) {
				logger.warn(
					`Could not delete fragment ${fragmentFile}: ${error.message}`,
				);
			}
		}

		// Stage changes for semantic-release to commit
		try {
			execSync(`git add "${VERSION_MDX_PATH}"`);

			if (fragmentsToDelete.size > 0) {
				for (const fragmentFile of fragmentsToDelete) {
					try {
						execSync(`git add "${fragmentFile}"`);
					} catch (_error) {
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
