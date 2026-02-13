import { useState, useEffect, useRef, memo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup'; // html
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import { Check, Copy, ChevronDown } from 'lucide-react';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';

interface CodeBlockProps {
    block: BlockType;
    onChange: (id: string, content: string) => void;
    onUpdate?: (id: string, props: any) => void;
    readOnly?: boolean;
}

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'python', label: 'Python' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'plaintext', label: 'Plain Text' },
];

export const CodeBlock = memo(function CodeBlock({ block, onChange, onUpdate, readOnly }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [language, setLanguage] = useState(block.props?.language || 'javascript');

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [block.content, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(block.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        onUpdate?.(block.id, { props: { ...block.props, language: newLang } });
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(block.id, e.target.value);
    };

    const handleScroll = () => {
        if (preRef.current && textareaRef.current) {
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [block.content]);

    return (
        <div className="relative group/code rounded-md overflow-hidden bg-[#2d2d2d] my-2 text-sm font-mono border border-neutral-700 w-full min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-neutral-400 border-b border-neutral-700 select-none">
                <div className="relative flex items-center gap-1 hover:text-neutral-200 transition-colors group/selector">
                    {!readOnly ? (
                        <div className="flex items-center gap-1 cursor-pointer">
                            <span className="text-xs font-medium text-neutral-400 group-hover/selector:text-neutral-200 transition-colors">
                                {LANGUAGES.find(l => l.value === language)?.label || 'Plain Text'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-neutral-500 group-hover/selector:text-neutral-300 transition-colors" />
                            <select
                                className="absolute inset-0 opacity-0 cursor-pointer text-neutral-900 bg-white"
                                value={language}
                                onChange={handleLanguageChange}
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value} className="text-neutral-900 bg-white py-1">{lang.label}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <span className="text-xs">{LANGUAGES.find(l => l.value === language)?.label || 'Plain Text'}</span>
                    )}
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>

            {/* Content Area - Overlay Textarea on Pre for Editing */}
            <div className="relative min-h-[3em]">
                {/* Syntax Highlighted View */}
                <pre
                    ref={preRef}
                    className={cn(
                        "!m-0 !p-4 !bg-transparent",
                        readOnly ? "!overflow-x-auto" : "!overflow-hidden"
                    )}
                    aria-hidden="true"
                >
                    <code
                        ref={codeRef}
                        className={`language-${language} whitespace-pre`}
                    >
                        {block.content || ' '}
                    </code>
                </pre>

                {/* Editable Textarea (Transparent text, visible caret) */}
                {!readOnly && (
                    <textarea
                        ref={textareaRef}
                        value={block.content}
                        onChange={handleInput}
                        onScroll={handleScroll}
                        className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white outline-none resize-none overflow-x-auto overflow-y-hidden font-mono text-[inherit] leading-[inherit] whitespace-pre z-10 scrollbar-hide"
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                            letterSpacing: 'inherit'
                        }}
                    />
                )}
            </div>
        </div>
    );
});
