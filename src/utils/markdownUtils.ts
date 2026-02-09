import TurndownService from 'turndown';
import { Block } from '../store/useDocumentStore';
import { v4 as uuidv4 } from 'uuid';

// Pre-compiled regex patterns for performance
const MARKDOWN_PATTERNS = [
    /^#{1,6}\s/m,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /^\s*>\s/m,
    /^```/m,
    /^\s*-\s*\[[ x]\]/mi,
    /^---$/m,
] as const;

// Pre-compiled parsing patterns
const HEADING_H3 = /^### /;
const HEADING_H2 = /^## /;
const HEADING_H1 = /^# /;
const DIVIDER = /^---+$/;
const QUOTE = /^> /;
const TODO_UNCHECKED = /^\s*-\s*\[\s*\]\s*/;
const TODO_CHECKED = /^\s*-\s*\[[xX]\]\s*/;
const BULLET = /^\s*[-*+]\s/;
const NUMBER = /^\s*\d+\.\s/;

// Lazy-initialized Turndown service
let turndownService: TurndownService | null = null;

function getTurndownService(): TurndownService {
    if (!turndownService) {
        turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
        });
    }
    return turndownService;
}

/**
 * Fast detection if text is likely Markdown (early exit on first match)
 */
export function isLikelyMarkdown(text: string): boolean {
    for (const pattern of MARKDOWN_PATTERNS) {
        if (pattern.test(text)) return true;
    }
    return false;
}

/**
 * Parse Markdown text into blocks - optimized with pre-compiled patterns
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let codeBlockContent: string[] = [];
    let inCodeBlock = false;

    for (let i = 0, len = lines.length; i < len; i++) {
        const line = lines[i];

        // Handle code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                blocks.push({
                    id: uuidv4(),
                    type: 'code',
                    content: codeBlockContent.join('\n'),
                });
                codeBlockContent = [];
            }
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Skip empty lines
        if (!line.trim()) continue;

        // Parse by priority (most common first)
        if (HEADING_H3.test(line)) {
            blocks.push({ id: uuidv4(), type: 'h3', content: line.slice(4) });
        } else if (HEADING_H2.test(line)) {
            blocks.push({ id: uuidv4(), type: 'h2', content: line.slice(3) });
        } else if (HEADING_H1.test(line)) {
            blocks.push({ id: uuidv4(), type: 'h1', content: line.slice(2) });
        } else if (DIVIDER.test(line)) {
            blocks.push({ id: uuidv4(), type: 'divider', content: '' });
        } else if (QUOTE.test(line)) {
            blocks.push({ id: uuidv4(), type: 'quote', content: line.slice(2) });
        } else if (TODO_UNCHECKED.test(line)) {
            blocks.push({
                id: uuidv4(),
                type: 'todo',
                content: line.replace(TODO_UNCHECKED, ''),
                props: { checked: false }
            });
        } else if (TODO_CHECKED.test(line)) {
            blocks.push({
                id: uuidv4(),
                type: 'todo',
                content: line.replace(TODO_CHECKED, ''),
                props: { checked: true }
            });
        } else if (BULLET.test(line)) {
            blocks.push({ id: uuidv4(), type: 'bullet', content: line.replace(BULLET, '') });
        } else if (NUMBER.test(line)) {
            blocks.push({ id: uuidv4(), type: 'number', content: line.replace(NUMBER, '') });
        } else {
            blocks.push({ id: uuidv4(), type: 'text', content: line });
        }
    }

    return blocks;
}

/**
 * Convert blocks to Markdown string - optimized with array join
 */
export function blocksToMarkdown(blocks: Block[]): string {
    const lines: string[] = new Array(blocks.length);
    let idx = 0;

    for (let i = 0, len = blocks.length; i < len; i++) {
        const block = blocks[i];
        switch (block.type) {
            case 'h1':
                lines[idx++] = `# ${block.content}`;
                break;
            case 'h2':
                lines[idx++] = `## ${block.content}`;
                break;
            case 'h3':
                lines[idx++] = `### ${block.content}`;
                break;
            case 'bullet':
                lines[idx++] = `- ${block.content}`;
                break;
            case 'number':
                lines[idx++] = `${i + 1}. ${block.content}`;
                break;
            case 'todo':
                lines[idx++] = `- [${block.props?.checked ? 'x' : ' '}] ${block.content}`;
                break;
            case 'quote':
                lines[idx++] = `> ${block.content}`;
                break;
            case 'divider':
                lines[idx++] = '---';
                break;
            case 'code':
                lines[idx++] = `\`\`\`\n${block.content}\n\`\`\``;
                break;
            case 'image':
                if (block.content) lines[idx++] = `![image](${block.content})`;
                break;
            case 'video':
                if (block.content) lines[idx++] = `[Video](${block.content})`;
                break;
            case 'callout':
                lines[idx++] = `> ⚠️ ${block.content}`;
                break;
            default:
                if (block.content) lines[idx++] = block.content;
        }
    }

    return lines.slice(0, idx).join('\n\n');
}

/**
 * Download content as a Markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Convert HTML to Markdown using Turndown (lazy-loaded)
 */
export function htmlToMarkdown(html: string): string {
    return getTurndownService().turndown(html);
}
