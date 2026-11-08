import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Eye, Edit3, Copy, Check } from 'lucide-react';

export interface MulticolorCodeViewerProps {
  code: string;
  language?: 'python' | 'javascript' | 'json' | 'text' | 'sql' | 'bash';
  editable?: boolean;
  onChange?: (newCode: string) => void;
  showLineNumbers?: boolean;
  className?: string;
}

interface Token {
  type:
    | 'keyword'
    | 'string'
    | 'number'
    | 'function'
    | 'builtin'
    | 'comment'
    | 'operator'
    | 'punctuation'
    | 'text';
  value: string;
}

// Tokenizer for Python syntax highlighting
function tokenizePython(line: string): Token[] {
  // Regex order matters:
  // 1: Comments (# ...)
  // 2: Strings ("..." or '...' or f"..." or r"...")
  // 3: Keywords (import, from, with, as, if, else, def, return, for, in, etc.)
  // 4: Builtins & Booleans (True, False, None, self, open, len, etc.)
  // 5: Numbers (0, 10, 3.14, etc.)
  // 6: Function calls (name followed by '(')
  // 7: Operators (=, ==, !=, +, -, etc.)
  // 8: Punctuation ([], {}, (), :, ,, .)
  // 9: Identifiers (variable names)
  const regex =
    /(#.*)|("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*'|r?"(?:\\.|[^"\\])*"|r?'(?:\\.|[^'\\])*')|(\b(?:import|from|with|as|if|elif|else|def|class|return|for|in|while|try|except|finally|raise|lambda|yield|assert|break|continue|pass|global|nonlocal|async|await|and|or|not|is)\b)|(\b(?:True|False|None|self|cls|int|str|float|bool|list|dict|set|tuple|len|range|enumerate|zip|sum|min|max|sorted|reversed|any|all|print|open|input|isinstance|issubclass|type|id|super|Exception|ValueError|TypeError|RuntimeError|KeyError|IndexError|FileNotFoundError|Counter)\b)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\s*(?=\())|(\+|-|\*|\/|%|\*\*|\/\/|=|==|!=|<=|>=|<|>|\+=|-=|\*=|\/=)|([{}()[\]:,;.])|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: line.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      tokens.push({ type: 'comment', value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'string', value: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'keyword', value: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'builtin', value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'number', value: match[5] });
    } else if (match[6]) {
      tokens.push({ type: 'function', value: match[6] });
    } else if (match[7]) {
      tokens.push({ type: 'operator', value: match[7] });
    } else if (match[8]) {
      tokens.push({ type: 'punctuation', value: match[8] });
    } else if (match[9]) {
      tokens.push({ type: 'text', value: match[9] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: 'text',
      value: line.slice(lastIndex),
    });
  }

  return tokens;
}

// Tokenizer for JSON syntax highlighting
function tokenizeJson(line: string): Token[] {
  const regex =
    /("(?:\\.|[^"\\])*"(?:\s*:))|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([{}[\],:])/g;

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: line.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Key
      tokens.push({ type: 'keyword', value: match[1] });
    } else if (match[2]) {
      // String value
      tokens.push({ type: 'string', value: match[2] });
    } else if (match[3]) {
      // Boolean/null
      tokens.push({ type: 'builtin', value: match[3] });
    } else if (match[4]) {
      // Number
      tokens.push({ type: 'number', value: match[4] });
    } else if (match[5]) {
      // Punctuation
      tokens.push({ type: 'punctuation', value: match[5] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: 'text',
      value: line.slice(lastIndex),
    });
  }

  return tokens;
}

// Style map for token types
function getTokenStyle(type: Token['type']): string {
  switch (type) {
    case 'keyword':
      // Vibrant purple / magenta (e.g. import, from, with, as, if, def)
      return 'text-[#C084FC] font-semibold';
    case 'string':
      // Bright emerald / green (e.g. "raw_stories.json", "utf-8")
      return 'text-[#4ADE80]';
    case 'number':
      // Warm amber / orange (e.g. 0, 10, 3.14)
      return 'text-[#FB923C]';
    case 'function':
      // Electric blue (e.g. open, load, get, sorted, Counter)
      return 'text-[#60A5FA] font-medium';
    case 'builtin':
      // Crisp sky cyan (e.g. True, False, None, self, RuntimeError)
      return 'text-[#38BDF8]';
    case 'comment':
      // Muted slate gray italic (e.g. # comment)
      return 'text-[#64748B] italic';
    case 'operator':
      // Light rose / slate (e.g. =, ==, +, -, :)
      return 'text-[#F472B6]';
    case 'punctuation':
      // Muted cool slate for brackets, braces, commas, colons
      return 'text-[#94A3B8]';
    case 'text':
    default:
      // Clean off-white for variables and identifiers (e.g. stories, points, f)
      return 'text-[#F1F5F9]';
  }
}

export const MulticolorCodeViewer: React.FC<MulticolorCodeViewerProps> = ({
  code,
  language = 'python',
  editable = false,
  onChange,
  showLineNumbers = true,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => code.split(/\r?\n/), [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-[#141414] rounded-lg border border-[#262626] overflow-hidden select-text ${className}`}>
      {/* Mini Mode Bar (when editable) */}
      {editable && (
        <div className="h-8 px-3 bg-[#1A1A1A] border-b border-[#242424] flex items-center justify-between shrink-0 select-none text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(false)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${
                !isEditing
                  ? 'bg-[#2E2E2E] text-[#38BDF8] font-semibold'
                  : 'text-[#777777] hover:text-[#D0D0D0]'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Highlighted</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer ${
                isEditing
                  ? 'bg-[#2E2E2E] text-[#38BDF8] font-semibold'
                  : 'text-[#777777] hover:text-[#D0D0D0]'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Code</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[#282828] text-[#777777] hover:text-[#D0D0D0] cursor-pointer flex items-center gap-1"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
            <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Editor or Highlighted View Area */}
      <div className="flex-1 flex min-h-0 overflow-auto relative font-mono text-[12.5px] leading-5">
        {isEditing && editable ? (
          /* Editable Textarea */
          <div className="flex-1 flex min-h-full">
            {showLineNumbers && (
              <div className="py-2.5 px-2 bg-[#121212] border-r border-[#222222] select-none text-right font-mono text-[11px] text-[#555555] shrink-0 min-w-[38px]">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5 h-5">
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange?.(e.target.value)}
              className="flex-1 bg-transparent text-[#F1F5F9] font-mono text-[12.5px] leading-5 p-2.5 outline-none resize-none whitespace-pre selection:bg-[#38BDF8]/25"
              placeholder="Enter script code…"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Multicolor Syntax Highlighted View */
          <div className="flex-1 flex min-h-full">
            {showLineNumbers && (
              <div className="py-2.5 px-2 bg-[#121212] border-r border-[#222222] select-none text-right font-mono text-[11px] text-[#555555] shrink-0 min-w-[38px]">
                {lines.map((_, i) => (
                  <div key={i} className="leading-5 h-5">
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            <pre className="flex-1 p-2.5 m-0 font-mono text-[12.5px] leading-5 overflow-x-auto whitespace-pre select-text">
              <code>
                {lines.map((line, lineIdx) => {
                  const tokens =
                    language === 'json' ? tokenizeJson(line) : tokenizePython(line);

                  return (
                    <div key={lineIdx} className="leading-5 min-h-[20px]">
                      {tokens.length === 0 ? (
                        <span>&nbsp;</span>
                      ) : (
                        tokens.map((token, tokIdx) => (
                          <span
                            key={tokIdx}
                            className={getTokenStyle(token.type)}
                          >
                            {token.value}
                          </span>
                        ))
                      )}
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

