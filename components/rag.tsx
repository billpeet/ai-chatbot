import { useState, useRef, useEffect } from "react";

interface DocumentResult {
  name: string;
  similarity: number;
}

export const FindRelevantContentResult = ({
  result,
}: {
  result: DocumentResult[];
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [popupPosition, setPopupPosition] = useState<{
    [key: string]: { top: number; left: number };
  }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const toggleExpand = (docName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docName)) {
      newExpanded.delete(docName);
    } else {
      newExpanded.add(docName);
      // Calculate popup position
      const button = buttonRefs.current[docName];
      if (button) {
        const rect = button.getBoundingClientRect();
        setPopupPosition((prev) => ({
          ...prev,
          [docName]: {
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX,
          },
        }));
      }
    }
    setExpandedDocs(newExpanded);
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedDocs.size > 0) {
        setExpandedDocs(new Set());
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [expandedDocs]);

  return (
    <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-gray-500">Relevant content:</span>
        <div className="flex gap-1 flex-wrap">
          {result.map((doc) => (
            <div
              key={doc.name}
              className="inline-flex items-center gap-1 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-200"
            >
              <span className="truncate max-w-[150px]">{doc.name}</span>
              <span className="text-gray-400">·</span>
              <span className="text-blue-600 font-medium">
                {(doc.similarity * 100).toFixed(0)}%
              </span>
              {doc.name && (
                <>
                  <button
                    ref={(el) => {
                      buttonRefs.current[doc.name] = el;
                    }}
                    onClick={(e) => toggleExpand(doc.name, e)}
                    className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 focus:outline-none"
                    aria-label={
                      expandedDocs.has(doc.name)
                        ? "Collapse snippet"
                        : "Expand snippet"
                    }
                  >
                    {expandedDocs.has(doc.name) ? (
                      // Down arrow SVG
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="inline align-middle"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      // Right arrow SVG
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="inline align-middle"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 5.23a.75.75 0 011.06-.02l4.4 4.24a.75.75 0 010 1.08l-4.4 4.24a.75.75 0 11-1.04-1.08L11.085 10 7.23 6.29a.75.75 0 01-.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  {expandedDocs.has(doc.name) && (
                    <div
                      className="fixed bg-white border border-gray-200 rounded shadow-lg p-3 max-w-md z-50"
                      style={{
                        top: `${popupPosition[doc.name]?.top}px`,
                        left: `${popupPosition[doc.name]?.left}px`,
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <button
                          onClick={(e) => toggleExpand(doc.name, e)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {doc.name.trim()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
