import React from 'react';
import type { ManualData } from '../types';

interface ManualDisplayProps {
    data: ManualData;
    topic: string;
    onSave: () => void;
    isSaved: boolean;
}


const LinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);


const ManualDisplay: React.FC<ManualDisplayProps> = ({ data, topic, onSave, isSaved }) => {
    const { content, sources } = data;

    const renderFormattedContent = () => {
        const elements: React.ReactElement[] = [];
        const lines = content.split('\n');
        let listItems: string[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 pl-4">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }}></li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };

        lines.forEach((line, index) => {
            const formattedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
                .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>'); // Format citations
            
            if (formattedLine.startsWith('## ')) {
                flushList();
                elements.push(<h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-slate-900 border-b pb-2">{formattedLine.substring(3)}</h2>);
            } else if (formattedLine.startsWith('### ')) {
                 flushList();
                elements.push(<h3 key={index} className="text-xl font-bold mt-6 mb-3 text-slate-800">{formattedLine.substring(4)}</h3>);
            } else if (formattedLine.startsWith('* ') || formattedLine.startsWith('- ')) {
                listItems.push(formattedLine.substring(2));
            } else if (formattedLine.trim() === '') {
                flushList();
            } else {
                flushList();
                elements.push(<p key={index} className="mb-4 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }}></p>);
            }
        });

        flushList();
        return elements;
    };

    return (
        <div className="bg-white rounded-lg shadow-md mt-8 w-full max-w-4xl mx-auto animate-fade-in">
             <header className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 capitalize">{topic}</h1>
                <button
                    onClick={onSave}
                    disabled={isSaved}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaved ? 'Saved' : 'Save Manual'}
                </button>
            </header>
            <article className="p-6 md:p-8">
                {renderFormattedContent()}
            </article>

            {sources.length > 0 && (
                <footer className="p-6 md:p-8 mt-8 border-t border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">References</h3>
                    <ul className="space-y-3">
                        {sources.map((source, index) => source.web && (
                            <li key={index} className="text-sm">
                                <LinkIcon />
                                <a
                                    href={source.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                                    title={source.web.uri}
                                >
                                    {source.web.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </footer>
            )}
        </div>
    );
};

export default ManualDisplay;
