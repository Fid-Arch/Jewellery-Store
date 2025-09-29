import React from "react";
import { Edit, Trash2 } from "lucide-react";

function DataTable({ columns, data, onEdit, onDelete, loading, emptyMessage = "No data available" }) {
  const hasActions = onEdit || onDelete;
  
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-2xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 text-sm font-semibold border-b border-gray-200 dark:border-gray-600">
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-6 py-4 text-sm font-semibold border-b border-gray-200 dark:border-gray-600 text-center">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-yellow-50 dark:hover:bg-gray-700 transition">
                {columns.map((col, j) => (
                  <td
                    key={j}
                    className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 text-center">
                    <div className="flex justify-center space-x-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
