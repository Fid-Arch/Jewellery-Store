import React from "react";

function DataTable({ columns, data }) {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-2xl">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gradient-to-r from-yellow-50 to-yellow-100 text-gray-700">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 text-sm font-semibold border-b">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-6 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-yellow-50 transition">
                {columns.map((col, j) => (
                  <td
                    key={j}
                    className="px-6 py-4 border-b text-sm text-gray-700"
                  >
                    {row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
