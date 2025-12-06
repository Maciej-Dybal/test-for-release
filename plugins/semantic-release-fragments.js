#!/usr/bin/env node

const fs = require("node:fs").promises;
const { execSync } = require("node:child_process");

/**
 * Standalone Script for Fragment-based Changelog Generation
 *
 * This script processes commits and optional fragment files to generate
 * comprehensive changelog entries with developer-controlled content.
 * Used via @semantic-release/exec in the prepare phase.
 */

const FRAGMENT_DIR = "stories/01. Docs/fragments";
const VERSION_MDX_PATH = "stories/01. Docs/Version.mdx";

/**
 * Parse conventional commit format
 */
function parseCommit(commitMessage) {
	// Match conventional commit: type(scope): subject
	const conventionalMatch = commitMessage.match(
		/^(\w+)(\([^)]+\))?(!)?:\s*(.+)$/,
	);

	if (!conventionalMatch) {
		return {
			type: "other",
			scope: null,
			breaking: false,
			subject: commitMessage.split("\n")[0],
			body: commitMessage.split("\n").slice(1).join("\n").trim(),
		};
	}

	const [, type, scopeWithParens, breakingMarker, subject] = conventionalMatch;
	const scope = scopeWithParens ? scopeWithParens.slice(1, -1) : null;
	const breaking =
		!!breakingMarker || commitMessage.includes("BREAKING CHANGE:");

	return {
		type,
		scope,
		breaking,
		subject,
		body: commitMessage.split("\n").slice(1).join("\n").trim(),
	};
}

/**
 * Determine category from commit type
 */
function getCategory(parsedCommit) {
	if (parsedCommit.breaking) {
		return "Breaking Changes";
	}

	switch (parsedCommit.type) {
		case "feat":
			return "Features";
		case "fix":
			return "Bugfixes";
		case "perf":
		case "refactor":
		case "style":
		case "docs":
		case "test":
		case "chore":
			return "Improvements";
		default:
			return "Other";
	}
}

/**
 * Parse fragment file content
 */
function parseFragment(content) {
	const lines = content.split("\n");
	const metadata = {};
	let contentStart = 0;

	// Parse frontmatter-style metadata
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
		summary: metadata.summary,
		details: metadata.details,
		content: content_lines.join("\n").trim(),
	};
}

/**
 * Get commits for the current release
 */
async function getCurrentReleaseCommits() {
	try {
		// Get commits since last tag
		const lastTag = execSync(
			'git describe --tags --abbrev=0 2>/dev/null || echo ""',
			{ encoding: "utf8" },
		).trim();
		const range = lastTag ? `${lastTag}..HEAD` : "HEAD";

		const commits = execSync(
			`git log ${range} --pretty=format:"%H|||%s|||%B" --no-merges`,
			{ encoding: "utf8" },
		)
			.split("\n")
			.filter((line) => line.trim())
			.map((line) => {
				const [hash, subject, ...bodyParts] = line.split("|||");
				return {
					hash: hash?.trim(),
					message: [subject, ...bodyParts].join("\n").trim(),
				};
			});

		return commits;
	} catch (_error) {
		console.log("Could not get commits, using empty array");
		return [];
	}
}

/**
 * Get fragments modified by commit
 */
async function getFragmentsFromCommit(commitHash) {
	try {
		// Get files changed in this commit
		const changedFiles = execSync(
			`git diff-tree --no-commit-id --name-only -r ${commitHash}`,
			{ encoding: "utf8" },
		)
			.split("\n")
			.filter((file) => file.trim())
			.filter((file) => file.startsWith(FRAGMENT_DIR) && file.endsWith(".mdx"));

		const fragments = [];

		for (const file of changedFiles) {
			try {
				const content = await fs.readFile(file, "utf8");
				const fragment = parseFragment(content);
				fragments.push({
					file,
					...fragment,
				});
			} catch (_error) {}
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
		if (item?.content?.trim()) {
			// Use fragment content if available
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
 * Main function
 */
async function main() {
	// Get version from environment variable set by semantic-release
	const nextVersion = process.env.NEXT_VERSION || process.argv[2];

	if (!nextVersion) {
		console.log("No version found, skipping fragment processing");
		process.exit(0);
	}

	console.log(
		`Processing commits for changelog generation (version ${nextVersion})`,
	);

	// Get commits for this release
	const commits = await getCurrentReleaseCommits();

	if (commits.length === 0) {
		console.log("No commits found, skipping fragment processing");
		process.exit(0);
	}

	// Process each commit
	const changelogData = {
		"Breaking Changes": {},
		Features: {},
		Bugfixes: {},
		Improvements: {},
		Other: {},
	};

	const fragmentsToDelete = new Set();

	for (const commit of commits) {
		const parsedCommit = parseCommit(commit.message);
		const category = getCategory(parsedCommit);
		const component = parsedCommit.scope || "Uncategorized";

		// Get fragments from this commit
		const fragments = await getFragmentsFromCommit(commit.hash);

		if (fragments.length > 0) {
			// Process fragments
			for (const fragment of fragments) {
				const fragmentComponent = fragment.component || component;
				const fragmentCategory = category; // Commit category takes precedence

				if (!changelogData[fragmentCategory][fragmentComponent]) {
					changelogData[fragmentCategory][fragmentComponent] = [];
				}

				changelogData[fragmentCategory][fragmentComponent].push({
					subject: parsedCommit.subject,
					content: fragment.content,
					summary: fragment.summary,
					details: fragment.details,
				});

				fragmentsToDelete.add(fragment.file);
			}
		} else {
			// No fragments, use commit info directly
			if (!changelogData[category][component]) {
				changelogData[category][component] = [];
			}

			changelogData[category][component].push({
				subject: parsedCommit.subject,
				content: null,
			});
		}
	}

	// Generate MDX content
	const releaseDate = new Date().toISOString().split("T")[0];
	let mdxContent = `### Version ${nextVersion}\n\n#### Released on: ${releaseDate}\n\n`;

	// Add categories in order
	for (const [category, components] of Object.entries(changelogData)) {
		const componentEntries = Object.keys(components);
		if (componentEntries.length === 0) continue;

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
			// File doesn't exist, create basic structure
			existingContent =
				"## Version history\n\n{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}\n";
		}

		const marker = "{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}";
		const newContent = existingContent.replace(
			marker,
			`${marker}\n\n${mdxContent}`,
		);

		await fs.writeFile(VERSION_MDX_PATH, newContent, "utf8");
		console.log(
			`Updated ${VERSION_MDX_PATH} with changelog for version ${nextVersion}`,
		);

		// Delete processed fragments
		for (const fragmentFile of fragmentsToDelete) {
			try {
				await fs.unlink(fragmentFile);
				console.log(`Deleted processed fragment: ${fragmentFile}`);
			} catch (error) {
				console.warn(
					`Could not delete fragment ${fragmentFile}: ${error.message}`,
				);
			}
		}

		// Stage changes for semantic-release to commit
		try {
			execSync(`git add ${VERSION_MDX_PATH}`);

			if (fragmentsToDelete.size > 0) {
				// Add deleted fragments
				for (const fragmentFile of fragmentsToDelete) {
					execSync(`git add ${fragmentFile}`).catch(() => {
						// File might already be deleted
					});
				}
			}

			console.log("Staged changelog updates for semantic-release commit");
		} catch (error) {
			console.warn(`Could not stage changelog: ${error.message}`);
		}
	} catch (error) {
		console.error(`Error updating changelog: ${error.message}`);
		process.exit(1);
	}
}

// Run the script
main().catch((error) => {
	console.error("Script failed:", error);
	process.exit(1);
});
