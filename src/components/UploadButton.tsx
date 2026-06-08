import { useRef, type MouseEvent } from 'react';

interface UploadButtonProps {
  disabled: boolean;
  onFileSelect: (file: File) => void;
}

export function UploadButton({ disabled, onFileSelect }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.ai"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          px-8 py-4 rounded-lg text-white font-semibold text-lg
          transition-all duration-300 transform
          ${disabled
            ? 'bg-gray-400 cursor-not-allowed opacity-60'
            : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {disabled ? '处理中...' : '上传图片'}
      </button>
      <p className="text-gray-500 text-sm mt-2">支持 JPG、PNG、AI 等图片格式</p>
    </div>
  );
}
