#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Alternative approach: Read git commits directly to get full commit data
 */

const versionMdxPath = path.join(__dirname, "../stories/01. Docs/Version.mdx");
const nextVersion = process.env.NEXT_VERSION;

if (!nextVersion) {
    console.log("No version found, skipping Version.mdx update");
    process.exit(0);
}

// Get commits since last tag
try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    
    // Get commit data with format: hash|type|scope|subject|body
    const gitLog = execSync(`git log ${range} --pretty=format:"%H|%s|%b|||"`, { encoding: 'utf8' });
    
    const commits = gitLog.split('|||').filter(commit => commit.trim());
    const groupedCommits = {
        features: [],
        fixes: [],
        breaking: []
    };
    
    commits.forEach(commitData => {
        const [hash, subject, ...bodyParts] = commitData.split('|');
        const body = bodyParts.join('|').trim();
        
        // Parse conventional commit format
        const conventionalMatch = subject.match(/^(feat|fix|BREAKING CHANGE)(?:\(([^)]+)\))?: (.+)$/);
        if (conventionalMatch) {
            const [, type, scope, description] = conventionalMatch;
            const capitalizedScope = scope ? scope.charAt(0).toUpperCase() + scope.slice(1) : 'General';
            
            const commitInfo = {
                scope: capitalizedScope,
                description,
                body: body || description,
                hash: hash.substring(0, 7)
            };
            
            if (type === 'feat') groupedCommits.features.push(commitInfo);
            else if (type === 'fix') groupedCommits.fixes.push(commitInfo);
            else if (type === 'BREAKING CHANGE') groupedCommits.breaking.push(commitInfo);
        }
    });
    
    // Generate formatted output
    let output = `### Version ${nextVersion}\n\n#### Released on: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    if (groupedCommits.features.length > 0) {
        output += `### FEATURES\n\n`;
        groupedCommits.features.forEach(commit => {
            output += `- **${commit.scope}:**\n\t- ${commit.body}\n\n`;
        });
    }
    
    if (groupedCommits.fixes.length > 0) {
        output += `### BUG FIXES\n\n`;
        groupedCommits.fixes.forEach(commit => {
            output += `- **${commit.scope}:**\n\t- ${commit.body}\n\n`;
        });
    }
    
    if (groupedCommits.breaking.length > 0) {
        output += `### BREAKING CHANGES\n\n`;
        groupedCommits.breaking.forEach(commit => {
            output += `- **${commit.scope}:**\n\t- ${commit.body}\n\n`;
        });
    }
    
    // Update Version.mdx
    let content = fs.existsSync(versionMdxPath) ? fs.readFileSync(versionMdxPath, 'utf8') : '';
    const marker = "{/* AUTO-GENERATED RELEASES WILL BE INSERTED HERE */}";
    const newContent = content.replace(marker, `${marker}\n\n${output}`);
    
    fs.writeFileSync(versionMdxPath, newContent, 'utf8');
    console.log(`Updated Version.mdx with version ${nextVersion} using git history`);
    
} catch (error) {
    console.error('Error reading git history:', error.message);
    // Fallback to original script
    require('./update-version-mdx.js');
}