import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { SUMMARY_MARKER } from '../constants.js';
import { safeReadJson } from '../fs-utils.js';

/**
 * Updates an existing sticky PR comment or creates a new one via GitHub CLI (`gh`).
 * Using a temp file avoids shell argument escaping issues with multi-line Markdown tables.
 *
 * @param {string} markdown Formatted Markdown summary.
 * @returns {void}
 */
export function updateOrPostPRComment(markdown) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return;

  const event = safeReadJson(eventPath);
  const prNumber = event?.pull_request?.number;
  if (!prNumber) return;

  const repo = process.env.GITHUB_REPOSITORY;
  const tmpFile = path.resolve('.pr_comment.md');

  try {
    console.log(`Detected Pull Request #${prNumber}. Searching for existing summary comment...`);

    const listCmd = `gh pr view ${prNumber} --json comments --jq '.comments[] | {id: .id, body: .body}'`;
    const commentsRaw = execSync(listCmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });

    const comments = commentsRaw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Find previous report by unique HTML comment marker to update in-place instead of spamming comments.
    const existing = comments.find((c) => c.body && c.body.includes(SUMMARY_MARKER));

    fs.writeFileSync(tmpFile, markdown, 'utf8');

    if (existing && existing.id) {
      console.log(`Updating existing comment ${existing.id}...`);
      execSync(`gh api -X PATCH "repos/${repo}/issues/comments/${existing.id}" -F body=@${tmpFile}`, {
        stdio: 'inherit'
      });
    } else {
      console.log(`Creating new sticky comment on PR #${prNumber}...`);
      execSync(`gh pr comment ${prNumber} --body-file ${tmpFile}`, {
        stdio: 'inherit'
      });
    }

    console.log(`Successfully updated PR #${prNumber} comment.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Note: Could not update PR comment (insufficient permissions or not a PR):', message);
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}
