import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getLanguagePack } from '../utils/i18n';
import { Language } from '../types';

interface CodeBlockProps {
  language: string;
  value: string;
  currentLanguage: Language;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, currentLanguage }) => {
  const [copied, setCopied] = useState(false);
  const langPack = getLanguagePack(currentLanguage);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs font-mono text-gray-300 lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-all"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? langPack.copied : langPack.copy}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;