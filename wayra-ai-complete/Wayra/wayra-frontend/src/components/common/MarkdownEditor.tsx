import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  height = 'h-64',
  className = ''
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Simple markdown-like rendering for preview
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    
    // Basic markdown-like replacements
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  };

  // Sync scrolling between editor and preview
  const syncScroll = () => {
    if (editorRef.current && previewRef.current) {
      const ratio = editorRef.current.scrollTop / (editorRef.current.scrollHeight - editorRef.current.clientHeight);
      previewRef.current.scrollTop = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Toggle Buttons */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              !isPreview
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <PencilIcon className="w-4 h-4 mr-2 inline" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 ${
              isPreview
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <EyeIcon className="w-4 h-4 mr-2 inline" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="w-full">
        {!isPreview ? (
          /* Markdown Editor */
          <textarea
            ref={editorRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            onScroll={syncScroll}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${height}`}
            style={{ scrollBehavior: 'smooth' }}
          />
        ) : (
          /* Markdown Preview */
          <div
            ref={previewRef}
            className={`w-full p-4 border border-gray-300 rounded-md bg-gray-50 overflow-auto ${height}`}
            style={{ scrollBehavior: 'smooth' }}
          >
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </div>
        )}
      </div>

      {/* Markdown Help Text */}
      {!isPreview && (
        <div className="mt-2 text-xs text-gray-500">
          <p>
            <strong>Markdown supported:</strong> **bold**, *italic*, `code`, # headers, * lists, > quotes, [links](url)
          </p>
        </div>
      )}
    </div>
  );
};
