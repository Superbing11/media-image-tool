import { downloadImage, type HistoryRecord } from '../utils/imageUtils';

interface HistoryListProps {
  records: HistoryRecord[];
}

export function HistoryList({ records }: HistoryListProps) {
  if (records.length === 0) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-md mt-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">历史记录</h3>
      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <img
                src={record.dataUrl}
                alt={record.processedName}
                className="w-12 h-12 object-contain bg-gray-100 rounded-lg"
              />
              <div>
                <p className="font-medium text-gray-700 text-sm truncate max-w-[150px]">
                  {record.processedName}
                </p>
                <p className="text-xs text-gray-400">{formatDate(record.timestamp)}</p>
              </div>
            </div>
            <button
              onClick={() => downloadImage(record.dataUrl, record.processedName)}
              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="下载"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
