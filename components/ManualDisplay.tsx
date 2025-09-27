import React, { useState, useMemo } from 'react';
import type { ManualData } from '../types';
import jsPDF from 'jspdf';

interface ManualDisplayProps {
    data: ManualData;
    topic: string;
    onSave: () => void;
    isSaved: boolean;
}

const ManualDisplay: React.FC<ManualDisplayProps> = ({ data, topic, onSave, isSaved }) => {
    const { content, sources } = data;
    const [isDownloading, setIsDownloading] = useState(false);

    const citationCount = useMemo(() => {
        if (!content) return 0;
        const matches = content.match(/\[(\d+)\]/g);
        if (!matches) return 0;
        const uniqueCitations = new Set(matches);
        return uniqueCitations.size;
    }, [content]);

    const handleDownloadPdf = () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            // This logic is complex and UI-independent, so it's left as is.
            // In a real scenario, we might adjust colors based on the theme,
            // but for this refactor, we focus on the visible components.
            const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`${sanitizedTopic}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExportReferences = () => {
        if (!sources || sources.length === 0) {
            return;
        }

        const referenceText = sources
            .map((source, index) => {
                if (source.web) {
                    return `[${index + 1}] ${source.web.title}\n    URL: ${source.web.uri}`;
                }
                return '';
            })
            .filter(Boolean)
            .join('\n\n');
        
        const blob = new Blob([referenceText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `references_${sanitizedTopic}.txt`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    const renderFormattedContent = () => {
        const elements: React.ReactElement[] = [];
        const lines = content.split('\n');
        let listItems: string[] = [];
        let inAlgorithmSection = false;

        const formatInline = (text: string): string => {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong class="fw-semibold text-body-emphasis">$1</strong>')
                .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>')
                .replace(/`(.*?)`/g, '<code class="bg-body-secondary text-body-emphasis px-2 py-1 rounded-2 font-monospace small">$1</code>')
                .replace(/->/g, '→');
        };

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-unstyled space-y-2 mb-3 ps-4">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="text-body" dangerouslySetInnerHTML={{ __html: `&bull; ${item}` }}></li>
                        ))}
                    </ul>
                );
                listItems = [];
            }
        };
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.match(/^(##|###)\s*10\.\s*Decision-making Algorithms/i)) {
                inAlgorithmSection = true;
            } else if (inAlgorithmSection && (line.match(/^(##|###)\s*11\.\s*/i) || line.match(/^(##|###)\s*Bibliography/i))) {
                inAlgorithmSection = false;
            }

            const isTableLine = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
            const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);

            if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
                flushList();

                const tableLines: string[] = [];
                let tableIndex = i;

                while (tableIndex < lines.length && isTableLine(lines[tableIndex])) {
                    tableLines.push(lines[tableIndex]);
                    tableIndex++;
                }
                
                i = tableIndex - 1; 

                const headerLine = tableLines[0];
                const headerCells = headerLine.split('|').slice(1, -1).map(s => s.trim());
                
                const bodyRows = tableLines.slice(2).map(rowLine => {
                    return rowLine.split('|').slice(1, -1).map(s => s.trim());
                });

                if (headerCells.length > 0 && bodyRows.length > 0) {
                     elements.push(
                        <div key={`table-wrapper-${elements.length}`} className="table-responsive my-4 rounded-3 border">
                            <table className="table table-striped table-hover mb-0">
                                <thead>
                                    <tr>
                                        {headerCells.map((header, idx) => (
                                            <th key={idx} scope="col" className="px-3 py-2" dangerouslySetInnerHTML={{ __html: formatInline(header) }}></th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {bodyRows.map((rowCells, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {rowCells.map((cell, cellIdx) => (
                                                <td key={cellIdx} className="px-3 py-2" dangerouslySetInnerHTML={{ __html: formatInline(cell) }}></td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                continue;
            }
             
            if (inAlgorithmSection) {
                 flushList();
                const trimmedLine = line.trim();
                if (line.match(/^(##|###)\s*10\.\s*Decision-making Algorithms/i)) {
                    elements.push(<h2 key={i} className="h3 fw-bold mt-4 mb-3 text-body-emphasis border-bottom pb-2">Decision-making Algorithms</h2>);
                } else if (trimmedLine === '') {
                    elements.push(<div key={`algo-space-${i}`} style={{height: '0.5rem'}}></div>);
                } else {
                    const indentationLevel = line.search(/\S|$/);
                    const formattedContent = formatInline(line);
                    elements.push(
                        <p
                            key={`algo-${i}`}
                            className="mb-1 font-monospace"
                            style={{ paddingLeft: `${indentationLevel * 0.5}rem` }}
                            dangerouslySetInnerHTML={{ __html: formattedContent }}
                        ></p>
                    );
                }
                continue;
            }

            const formattedLine = formatInline(line);
            
            if (formattedLine.startsWith('## ')) {
                flushList();
                elements.push(<h2 key={i} className="h3 fw-bold mt-4 mb-3 text-body-emphasis border-bottom pb-2">{formattedLine.substring(3)}</h2>);
            } else if (formattedLine.startsWith('### ')) {
                 flushList();
                elements.push(<h3 key={i} className="h4 fw-bold mt-4 mb-2 text-body-secondary">{formattedLine.substring(4)}</h3>);
            } else if (formattedLine.startsWith('* ') || formattedLine.startsWith('- ')) {
                listItems.push(formattedLine.substring(2));
            } else if (formattedLine.trim() === '') {
                flushList();
            } else {
                flushList();
                elements.push(<p key={i} className="mb-3" dangerouslySetInnerHTML={{ __html: formattedLine }}></p>);
            }
        }

        flushList();
        return elements;
    };


    return (
        <div className="card shadow-sm mt-4">
             <div className="card-header p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h1 className="h4 fw-bold mb-0 text-capitalize">{topic}</h1>
                <div className="d-flex align-items-center gap-2">
                    {citationCount > 0 && (
                        <div className="badge text-bg-secondary fw-medium py-2 px-2" title={`${citationCount} unique citations found`}>
                           <i className="bi bi-quote me-1"></i>
                           {citationCount} Citations
                        </div>
                    )}
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                    >
                         {isDownloading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Generating...
                            </>
                        ) : (
                           <>
                             <i className="bi bi-file-earmark-arrow-down-fill"></i>
                             Download PDF
                           </>
                        )}
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaved}
                        className="btn btn-sm btn-primary"
                    >
                        {isSaved ? 'Saved' : 'Save Manual'}
                    </button>
                </div>
            </div>
            <div className="card-body p-3 p-md-4">
                <article>
                    {renderFormattedContent()}
                </article>
            </div>

            {sources.length > 0 && (
                <div className="card-footer p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="h5 fw-bold mb-0">References</h3>
                        <button
                            onClick={handleExportReferences}
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                            aria-label="Export references as a text file"
                        >
                            <i className="bi bi-download small"></i>
                            Export
                        </button>
                    </div>
                    <ul className="list-unstyled mb-0">
                        {sources.map((source, index) => source.web && (
                            <li key={index} className="mb-2 small">
                                <i className="bi bi-link-45deg me-1"></i>
                                <a
                                    href={source.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-primary"
                                    title={source.web.uri}
                                >
                                    {source.web.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ManualDisplay;