import { useState, useRef, useEffect, useCallback } from 'react';

interface CropModalProps {
  imageUrl: string;
  onConfirm: (cropArea: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

export function CropModal({ imageUrl, onConfirm, onCancel }: CropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      setImg(image);
      setImageLoaded(true);
    };
    image.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!imageLoaded || !img || !containerRef.current) return;

    const calculate = () => {
      const containerWidth = containerRef.current!.clientWidth - 40;
      const containerHeight = containerRef.current!.clientHeight - 40;
      
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const finalScale = Math.min(scaleX, scaleY, 1);
      
      setScale(finalScale);
      
      const offsetX = (containerWidth - img.width * finalScale) / 2;
      const offsetY = (containerHeight - img.height * finalScale) / 2;
      setOffset({ x: offsetX + 20, y: offsetY + 20 });
    };

    calculate();

    const resizeObserver = new ResizeObserver(() => {
      calculate();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageLoaded, img]);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !img) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    
    return { x: Math.max(0, Math.min(x, img.width)), y: Math.max(0, Math.min(y, img.height)) };
  }, [scale, offset, img]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    const pos = getMousePosition(e);
    setIsDragging(true);
    setStartPoint(pos);
    setEndPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;
    const pos = getMousePosition(e);
    setEndPoint(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getCropArea = () => {
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);
    return { x, y, width, height };
  };

  const handleConfirm = () => {
    const cropArea = getCropArea();
    if (cropArea.width > 10 && cropArea.height > 10) {
      onConfirm(cropArea);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !img || !imageLoaded || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);

    const cropArea = getCropArea();
    if (cropArea.width > 0 && cropArea.height > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.clearRect(
        offset.x + cropArea.x * scale,
        offset.y + cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );

      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        offset.x + cropArea.x * scale,
        offset.y + cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        offset.x + cropArea.x * scale,
        offset.y + cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(
        offset.x + cropArea.x * scale - 8,
        offset.y + cropArea.y * scale - 8,
        16,
        16
      );
      ctx.fillRect(
        offset.x + cropArea.x * scale + cropArea.width * scale - 8,
        offset.y + cropArea.y * scale - 8,
        16,
        16
      );
      ctx.fillRect(
        offset.x + cropArea.x * scale - 8,
        offset.y + cropArea.y * scale + cropArea.height * scale - 8,
        16,
        16
      );
      ctx.fillRect(
        offset.x + cropArea.x * scale + cropArea.width * scale - 8,
        offset.y + cropArea.y * scale + cropArea.height * scale - 8,
        16,
        16
      );
    }
  }, [imageLoaded, startPoint, endPoint, scale, offset, img]);

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-gray-600">加载图片中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">框选处理区域</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 relative bg-gray-900 overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ minHeight: '400px' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
          />
          
          {getCropArea().width < 10 && getCropArea().height < 10 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white/50 text-lg">请用鼠标框选要处理的区域</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 px-6 py-4 border-t">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={getCropArea().width < 10 || getCropArea().height < 10}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              getCropArea().width >= 10 && getCropArea().height >= 10
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}