import { useState, useEffect, useCallback } from 'react';
import { UploadButton } from './components/UploadButton';
import { ProgressBar } from './components/ProgressBar';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';
import { CropModal } from './components/CropModal';
import {
  processImage,
  generateProcessedName,
  saveToHistory,
  loadHistory,
  type HistoryRecord,
} from './utils/imageUtils';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultDataUrl, setResultDataUrl] = useState('');
  const [resultFilename, setResultFilename] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [error, setError] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    const savedHistory = loadHistory();
    setHistory(savedHistory);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentImageUrl(e.target?.result as string);
      setCurrentFile(file);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCropConfirm = useCallback(async (cropArea: { x: number; y: number; width: number; height: number }) => {
    if (!currentFile) return;
    
    setShowCropModal(false);
    setIsProcessing(true);
    setProgress(0);
    setShowResult(false);
    setError('');

    try {
      const processedDataUrl = await processImage(currentFile, setProgress, cropArea);
      const filename = generateProcessedName(currentFile.name);

      setResultDataUrl(processedDataUrl);
      setResultFilename(filename);
      setShowResult(true);

      const record: HistoryRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        originalName: currentFile.name,
        processedName: filename,
        dataUrl: processedDataUrl,
        timestamp: Date.now(),
      };

      saveToHistory(record);
      setHistory((prev) => [record, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理图片时发生错误');
    } finally {
      setIsProcessing(false);
    }
  }, [currentFile]);

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setCurrentImageUrl('');
    setCurrentFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">图片格式尺寸处理</h1>
          <p className="text-gray-500">
            上传图片，框选区域后自动转换为 1271 × 492 px 的 PNG 格式
          </p>
        </div>

        <div className="flex flex-col items-center">
          <UploadButton disabled={isProcessing} onFileSelect={handleFileSelect} />

          <ProgressBar progress={progress} visible={isProcessing} />

          {error && (
            <div className="w-full max-w-md mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
              {error}
            </div>
          )}

          <ResultCard
            filename={resultFilename}
            dataUrl={resultDataUrl}
            visible={showResult}
          />

          <HistoryList records={history} />
        </div>
      </div>

      {showCropModal && (
        <CropModal
          imageUrl={currentImageUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

export default App;