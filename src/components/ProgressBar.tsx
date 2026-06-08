interface ProgressBarProps {
  progress: number;
  visible: boolean;
}

export function ProgressBar({ progress, visible }: ProgressBarProps) {
  if (!visible) return null;

  return (
    <div className="w-full max-w-md mt-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>处理进度</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
