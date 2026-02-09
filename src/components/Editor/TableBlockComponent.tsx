import { useCallback, useLayoutEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Block } from '../../store/useDocumentStore';

interface TableBlockProps {
    block: Block;
    onUpdate: (id: string, props: any) => void;
}

const TableCell = ({
    initialContent,
    onChange,
    onDeleteRow,
    onDeleteCol,
    isFirstRow,
    isLastCol
}: {
    initialContent: string,
    onChange: (val: string) => void,
    onDeleteRow?: () => void,
    onDeleteCol?: () => void,
    isFirstRow?: boolean,
    isLastCol?: boolean
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (contentRef.current && contentRef.current.innerText !== initialContent) {
            // Only update if not focused to avoid cursor jumps
            if (document.activeElement !== contentRef.current) {
                contentRef.current.innerText = initialContent;
            }
        }
    }, [initialContent]);

    return (
        <td className="border border-neutral-300 dark:border-neutral-700 min-w-[100px] relative group/cell p-0 align-top">
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full h-full min-h-[32px] p-2 outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                onInput={(e) => onChange(e.currentTarget.innerText)}
                onBlur={(e) => onChange(e.currentTarget.innerText)}
            />
            {isFirstRow && onDeleteCol && (
                <button
                    contentEditable={false}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-100 z-10 bg-neutral-200 dark:bg-neutral-700 rounded p-0.5 hover:bg-red-100 hover:text-red-500 transition-opacity shadow-sm border border-neutral-300 dark:border-neutral-600"
                    onClick={onDeleteCol}
                    title="Delete Column"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
            {isLastCol && onDeleteRow && (
                <button
                    contentEditable={false}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 z-10 bg-neutral-200 dark:bg-neutral-700 rounded p-0.5 hover:bg-red-100 hover:text-red-500 transition-opacity shadow-sm border border-neutral-300 dark:border-neutral-600"
                    onClick={onDeleteRow}
                    title="Delete Row"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </td>
    )
}

export function TableBlock({ block, onUpdate }: TableBlockProps) {
    // Default to a 2x3 grid if no content
    const tableData: string[][] = block.props?.content || [
        ['', '', ''],
        ['', '', '']
    ];

    const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
        const newData = [...tableData.map(row => [...row])];
        if (newData[rowIndex]) {
            newData[rowIndex][colIndex] = value;
            onUpdate(block.id, { props: { ...block.props, content: newData } });
        }
    }, [block, onUpdate, tableData]);

    const addRow = useCallback(() => {
        const cols = tableData[0]?.length || 3;
        const newRow = Array(cols).fill('');
        const newData = [...tableData, newRow];
        onUpdate(block.id, { props: { ...block.props, content: newData } });
    }, [block, onUpdate, tableData]);

    const addColumn = useCallback(() => {
        const newData = tableData.map(row => [...row, '']);
        onUpdate(block.id, { props: { ...block.props, content: newData } });
    }, [block, onUpdate, tableData]);

    const handleDeleteRow = useCallback((rowIndex: number) => {
        if (tableData.length <= 1) return;
        const newData = tableData.filter((_, index) => index !== rowIndex);
        onUpdate(block.id, { props: { ...block.props, content: newData } });
    }, [block, onUpdate, tableData]);

    const handleDeleteColumn = useCallback((colIndex: number) => {
        if (tableData[0].length <= 1) return;
        const newData = tableData.map(row => row.filter((_, index) => index !== colIndex));
        onUpdate(block.id, { props: { ...block.props, content: newData } });
    }, [block, onUpdate, tableData]);


    return (
        <div className="w-full overflow-x-auto my-2 p-4 select-none">
            <div className="inline-block min-w-full">
                <table className="border-collapse text-sm min-w-full table-auto">
                    <tbody>
                        {tableData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="group/row">
                                {row.map((cell, colIndex) => (
                                    <TableCell
                                        key={`${rowIndex}-${colIndex}`}
                                        initialContent={cell}
                                        onChange={(val) => updateCell(rowIndex, colIndex, val)}
                                        isFirstRow={rowIndex === 0}
                                        isLastCol={colIndex === row.length - 1} // Only show row delete on last cell of row for UI cleanliness
                                        onDeleteCol={() => handleDeleteColumn(colIndex)}
                                        onDeleteRow={() => handleDeleteRow(rowIndex)}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
            <div className="flex gap-2 mt-2 text-xs text-neutral-500">
                <button
                    onClick={addRow}
                    className="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-300 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <Plus className="w-3 h-3" /> New Row
                </button>
                <button
                    onClick={addColumn}
                    className="flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-300 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <Plus className="w-3 h-3" /> New Column
                </button>
            </div>
        </div>
    );
}
