import React, { useState, useMemo } from 'react';
import type { ManualData } from '../types';
import jsPDF from 'jspdf';

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

const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CitationIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


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
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            
            // --- STYLING CONSTANTS ---
            const MARGIN = 15;
            const CONTENT_WIDTH = pageWidth - MARGIN * 2;
            const COLORS = { 
                HEADING: '#1e293b', 
                TEXT: '#334155', 
                LINK: '#2563EB', 
                BORDER: '#e2e8f0', // General border color
                CODE_BG: '#f1f5f9',
                TABLE_HEADER_BG: '#e2e8f0', // Changed: More distinct header (slate-200)
                TABLE_ROW_ALT_BG: '#f1f5f9', // Changed: More visible striping (slate-100)
                TABLE_BORDER: '#cbd5e1' // Added: Softer border color for tables (slate-300)
            };
            const FONT_SIZES = { H1: 20, H2: 16, H3: 14, P: 11, CODE: 9, TABLE: 9 };
            const LINE_HEIGHTS = { P: 6, H2: 8, H3: 7, TABLE: 4 }; // Adjusted table line height for better spacing
            const CELL_PADDING = 2; // Adjusted table cell padding for better balance

            let y = MARGIN;

            // --- HELPER FUNCTIONS ---
            const checkPageBreak = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - MARGIN) {
                    doc.addPage();
                    y = MARGIN;
                    return true;
                }
                return false;
            };

            const renderTextWithInlineCode = (text: string, x: number, currentY: number, options: { maxWidth: number }) => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(FONT_SIZES.P);
                doc.setTextColor(COLORS.TEXT);

                const parts = text.split(/(`.*?`)/g).filter(part => part);
                let currentX = x;
                const textParts = doc.splitTextToSize(parts.join(''), options.maxWidth);
                let lineY = currentY;

                textParts.forEach(lineText => {
                    checkPageBreak(LINE_HEIGHTS.P);
                    let tempX = x;
                    const lineParts = lineText.split(/(`.*?`)/g).filter(part => part);

                    lineParts.forEach(part => {
                        if (part.startsWith('`') && part.endsWith('`')) {
                            const codeText = part.slice(1, -1);
                            doc.setFont('courier', 'normal');
                            doc.setFontSize(FONT_SIZES.CODE);
                            const textWidth = doc.getStringUnitWidth(codeText) * FONT_SIZES.CODE / doc.internal.scaleFactor;
                            
                            doc.setFillColor(COLORS.CODE_BG);
                            doc.rect(tempX, lineY - (FONT_SIZES.P / 2.5), textWidth + 2, FONT_SIZES.P / 1.5, 'F');
                            doc.setTextColor(COLORS.HEADING);
                            doc.text(codeText, tempX + 1, lineY);
                            
                            tempX += textWidth + 2;
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(FONT_SIZES.P);
                            doc.setTextColor(COLORS.TEXT);
                        } else {
                            doc.text(part, tempX, lineY);
                            tempX += doc.getStringUnitWidth(part) * FONT_SIZES.P / doc.internal.scaleFactor;
                        }
                    });
                    lineY += LINE_HEIGHTS.P;
                });
                 y = lineY - LINE_HEIGHTS.P;
            };

            // --- PDF GENERATION LOGIC ---

            // 1. Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(FONT_SIZES.H1);
            doc.setTextColor(COLORS.HEADING);
            const titleLines = doc.splitTextToSize(topic, CONTENT_WIDTH);
            checkPageBreak(titleLines.length * 10);
            doc.text(titleLines, MARGIN, y);
            y += titleLines.length * 10 + 10;

            // 2. Body Content
            const lines = content.split('\n');
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];

                const isTableLine = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
                const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);
                
                // --- TABLE RENDERER ---
                if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
                    const tableStartIndex = i;
                    let tableEndIndex = i;
                    while (tableEndIndex < lines.length && isTableLine(lines[tableEndIndex])) {
                        tableEndIndex++;
                    }
                    const tableLines = lines.slice(tableStartIndex, tableEndIndex);
                    i = tableEndIndex;
                    
                    const headers = tableLines[0].split('|').slice(1, -1).map(s => s.trim());
                    const rows = tableLines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(s => s.trim()));
                    const colCount = headers.length;
                    if(colCount === 0) continue;

                    const colWidths = Array(colCount).fill(CONTENT_WIDTH / colCount);
                    
                    const calculateRowHeight = (cells: string[]) => {
                        let maxHeight = 0;
                        doc.setFontSize(FONT_SIZES.TABLE);
                        cells.forEach((cell, index) => {
                            const lines = doc.splitTextToSize(cell, colWidths[index] - (CELL_PADDING * 2));
                            const height = lines.length * LINE_HEIGHTS.TABLE + (CELL_PADDING * 2);
                            if (height > maxHeight) maxHeight = height;
                        });
                        return maxHeight;
                    };
                    
                    const headerHeight = calculateRowHeight(headers);
                    
                    const drawHeader = () => {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(FONT_SIZES.TABLE);
                        doc.setTextColor(COLORS.HEADING);
                        doc.setFillColor(COLORS.TABLE_HEADER_BG);
                        doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, 'F');
                        let currentX = MARGIN;
                        headers.forEach((header, index) => {
                            doc.text(header, currentX + colWidths[index]/2, y + headerHeight / 2, {
                                baseline: 'middle',
                                align: 'center',
                                maxWidth: colWidths[index] - (CELL_PADDING * 2)
                            });
                            currentX += colWidths[index];
                        });
                        y += headerHeight;
                    };

                    checkPageBreak(headerHeight + calculateRowHeight(rows[0] || []));
                    drawHeader();

                    rows.forEach((row, rowIndex) => {
                        const rowHeight = calculateRowHeight(row);
                        if(checkPageBreak(rowHeight)) {
                            drawHeader();
                        }

                        // Zebra striping
                        if (rowIndex % 2 !== 0) {
                            doc.setFillColor(COLORS.TABLE_ROW_ALT_BG);
                            doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F');
                        }
                        
                        doc.setDrawColor(COLORS.TABLE_BORDER);
                        let currentX = MARGIN;
                        row.forEach((cell, index) => {
                            doc.rect(currentX, y, colWidths[index], rowHeight, 'S');
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(FONT_SIZES.TABLE);
                            doc.setTextColor(COLORS.TEXT);
                            doc.text(cell, currentX + CELL_PADDING, y + rowHeight / 2, {
                                baseline: 'middle',
                                maxWidth: colWidths[index] - (CELL_PADDING * 2)
                            });
                            currentX += colWidths[index];
                        });
                        y += rowHeight;
                    });
                    y += 5; // Space after table
                    continue;
                }

                if (line.trim() === '') {
                    i++;
                    continue;
                }
                
                // --- CONTENT RENDERER ---
                if (line.startsWith('## ')) {
                    const text = line.substring(3);
                    checkPageBreak(12);
                    y += 6;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(FONT_SIZES.H2);
                    doc.setTextColor(COLORS.HEADING);
                    doc.text(text, MARGIN, y);
                    y += LINE_HEIGHTS.H2;
                } else if (line.startsWith('### ')) {
                    const text = line.substring(4);
                    checkPageBreak(10);
                    y += 4;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(FONT_SIZES.H3);
                    doc.setTextColor(COLORS.HEADING);
                    doc.text(text, MARGIN, y);
                    y += LINE_HEIGHTS.H3;
                } else if (line.startsWith('* ') || line.startsWith('- ')) {
                    const text = line.substring(2);
                    const bulletedText = `•  ${text}`
                    const textLines = doc.splitTextToSize(bulletedText, CONTENT_WIDTH - 5);
                    checkPageBreak(textLines.length * LINE_HEIGHTS.P + 2);
                    doc.setFontSize(FONT_SIZES.P);
                    doc.setTextColor(COLORS.TEXT);
                    renderTextWithInlineCode(bulletedText, MARGIN, y, { maxWidth: CONTENT_WIDTH - 5 });
                    y += textLines.length * LINE_HEIGHTS.P;
                } else {
                    const sanitizedLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
                    const textLines = doc.splitTextToSize(sanitizedLine, CONTENT_WIDTH);
                    checkPageBreak(textLines.length * LINE_HEIGHTS.P + 2);
                    renderTextWithInlineCode(sanitizedLine, MARGIN, y, { maxWidth: CONTENT_WIDTH });
                    y += textLines.length * LINE_HEIGHTS.P;
                }
                i++;
            }

            // 3. References
            if (sources.length > 0) {
                if(checkPageBreak(25)) {
                    y += 5;
                } else {
                    y += 10;
                }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(FONT_SIZES.H2);
                doc.setTextColor(COLORS.HEADING);
                doc.text('References', MARGIN, y);
                y += 10;

                sources.forEach(source => {
                    if (source.web) {
                        const titleLines = doc.splitTextToSize(`- ${source.web.title}`, CONTENT_WIDTH);
                        checkPageBreak(titleLines.length * 5 + 8);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(10);
                        doc.setTextColor(COLORS.LINK);
                        doc.textWithLink(source.web.title, MARGIN + 3, y, { url: source.web.uri });
                        y += titleLines.length * 5 + 2;
                    }
                });
            }

            const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`${sanitizedTopic}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            // Optionally, set an error state to show a message to the user
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
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
                .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>')
                .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md font-mono text-sm">$1</code>')
                .replace(/->/g, '→');
        };

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
                        <div key={`table-wrapper-${elements.length}`} className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {headerCells.map((header, idx) => (
                                            <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: formatInline(header) }}></th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {bodyRows.map((rowCells, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                                            {rowCells.map((cell, cellIdx) => (
                                                <td key={cellIdx} className="px-6 py-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: formatInline(cell) }}></td>
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
                // We don't want to render the header again
                if (line.match(/^(##|###)\s*10\.\s*Decision-making Algorithms/i)) {
                    elements.push(<h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-slate-900 border-b pb-2">Decision-making Algorithms</h2>);
                } else if (trimmedLine === '') {
                    elements.push(<div key={`algo-space-${i}`} className="h-2"></div>);
                } else {
                    const indentationLevel = line.search(/\S|$/);
                    const formattedContent = formatInline(line);
                    elements.push(
                        <p
                            key={`algo-${i}`}
                            className="mb-1 text-slate-800 leading-relaxed font-mono text-sm"
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
                elements.push(<h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-slate-900 border-b pb-2">{formattedLine.substring(3)}</h2>);
            } else if (formattedLine.startsWith('### ')) {
                 flushList();
                elements.push(<h3 key={i} className="text-xl font-bold mt-6 mb-3 text-slate-800">{formattedLine.substring(4)}</h3>);
            } else if (formattedLine.startsWith('* ') || formattedLine.startsWith('- ')) {
                listItems.push(formattedLine.substring(2));
            } else if (formattedLine.trim() === '') {
                flushList();
            } else {
                flushList();
                elements.push(<p key={i} className="mb-4 text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }}></p>);
            }
        }

        flushList();
        return elements;
    };

    return (
        <div className="bg-white rounded-lg shadow-md mt-8 w-full max-w-4xl mx-auto animate-fade-in">
             <header className="p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold text-slate-900 capitalize">{topic}</h1>
                <div className="flex items-center gap-2">
                    {citationCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg" title={`${citationCount} unique citations found`}>
                            <CitationIcon className="h-4 w-4" />
                            <span>{citationCount} Citations</span>
                        </div>
                    )}
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg shadow-sm hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                         {isDownloading ? (
                            <>
                                <LoadingSpinnerIcon className="h-4 w-4 mr-2" />
                                Generating...
                            </>
                        ) : (
                           <>
                             <DownloadIcon className="h-4 w-4 mr-2" />
                             Download as PDF
                           </>
                        )}
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaved}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaved ? 'Saved' : 'Save Manual'}
                    </button>
                </div>
            </header>
            <article className="p-6 md:p-8">
                {renderFormattedContent()}
            </article>

            {sources.length > 0 && (
                <footer className="p-6 md:p-8 mt-8 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800">References</h3>
                        <button
                            onClick={handleExportReferences}
                            className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg shadow-sm hover:bg-slate-200 transition-colors"
                            aria-label="Export references as a text file"
                        >
                            <DownloadIcon className="h-3 w-3 mr-1.5" />
                            Export
                        </button>
                    </div>
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