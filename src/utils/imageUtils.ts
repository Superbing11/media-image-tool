const TARGET_WIDTH = 1271;
const TARGET_HEIGHT = 492;
const BLACK_THRESHOLD = 30;

export interface HistoryRecord {
  id: string;
  originalName: string;
  processedName: string;
  dataUrl: string;
  timestamp: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isBlack(r: number, g: number, b: number): boolean {
  return r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD;
}

export function removeBlackBackground(imageData: ImageData): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const queue: [number, number][] = [];
  
  for (let x = 0; x < width; x++) {
    if (isBlack(data[(0 * width + x) * 4], data[(0 * width + x) * 4 + 1], data[(0 * width + x) * 4 + 2])) {
      queue.push([x, 0]);
      visited[0][x] = true;
    }
    if (isBlack(data[((height - 1) * width + x) * 4], data[((height - 1) * width + x) * 4 + 1], data[((height - 1) * width + x) * 4 + 2])) {
      queue.push([x, height - 1]);
      visited[height - 1][x] = true;
    }
  }
  
  for (let y = 0; y < height; y++) {
    if (isBlack(data[(y * width + 0) * 4], data[(y * width + 0) * 4 + 1], data[(y * width + 0) * 4 + 2])) {
      queue.push([0, y]);
      visited[y][0] = true;
    }
    if (isBlack(data[(y * width + width - 1) * 4], data[(y * width + width - 1) * 4 + 1], data[(y * width + width - 1) * 4 + 2])) {
      queue.push([width - 1, y]);
      visited[y][width - 1] = true;
    }
  }
  
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        const idx = (ny * width + nx) * 4;
        if (isBlack(data[idx], data[idx + 1], data[idx + 2])) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited[y][x]) {
        const idx = (y * width + x) * 4;
        data[idx + 3] = 0;
      }
    }
  }
  
  return imageData;
}

export function resizeAndCenter(
  sourceCanvas: HTMLCanvasElement
): HTMLCanvasElement {
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = TARGET_WIDTH;
  targetCanvas.height = TARGET_HEIGHT;
  const ctx = targetCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }
  
  ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  
  const sourceWidth = sourceCanvas.width;
  const sourceHeight = sourceCanvas.height;
  
  const scale = Math.min(
    TARGET_WIDTH / sourceWidth,
    TARGET_HEIGHT / sourceHeight
  );
  
  const newWidth = sourceWidth * scale;
  const newHeight = sourceHeight * scale;
  
  const x = (TARGET_WIDTH - newWidth) / 2;
  const y = (TARGET_HEIGHT - newHeight) / 2;
  
  ctx.drawImage(sourceCanvas, x, y, newWidth, newHeight);
  
  return targetCanvas;
}

async function convertAiToPng(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:3001/api/convert-ai', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(
      '当前 AI 文件格式不支持自动转换。请使用 Adobe Illustrator、Photoshop、GIMP 或在线转换工具将 AI 文件导出为 PNG 或 JPG 格式后再上传。'
    );
  }
  
  return result.data;
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('无法加载图片'));
    img.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsDataURL(file);
  });
}

export async function processImage(
  file: File,
  onProgress: (progress: number) => void,
  cropArea?: CropArea
): Promise<string> {
  onProgress(10);
  
  const fileName = file.name.toLowerCase();
  
  let imageDataUrl: string;
  
  if (fileName.endsWith('.ai')) {
    onProgress(20);
    imageDataUrl = await convertAiToPng(file);
    onProgress(50);
  } else {
    imageDataUrl = await readFileAsDataUrl(file);
    onProgress(30);
  }
  
  onProgress(40);
  const img = await loadImageFromDataUrl(imageDataUrl);
  
  onProgress(50);
  
  let cropCanvas: HTMLCanvasElement;
  
  if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
    cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropArea.width;
    cropCanvas.height = cropArea.height;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (!cropCtx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    cropCtx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);
  } else {
    cropCanvas = document.createElement('canvas');
    cropCanvas.width = img.width;
    cropCanvas.height = img.height;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (!cropCtx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    cropCtx.drawImage(img, 0, 0);
  }
  
  onProgress(60);
  const cropCtx = cropCanvas.getContext('2d');
  const imageData = cropCtx?.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
  
  if (!imageData) {
    throw new Error('无法获取图片数据');
  }
  
  const processedData = removeBlackBackground(imageData);
  
  onProgress(70);
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = cropCanvas.width;
  processedCanvas.height = cropCanvas.height;
  const processedCtx = processedCanvas.getContext('2d');
  
  if (processedCtx) {
    processedCtx.putImageData(processedData, 0, 0);
  }
  
  onProgress(80);
  const finalCanvas = resizeAndCenter(processedCanvas);
  
  onProgress(90);
  const dataUrl = finalCanvas.toDataURL('image/png');
  
  onProgress(100);
  
  return dataUrl;
}

export function generateProcessedName(originalName: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_processed.png`;
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function saveToHistory(record: HistoryRecord): void {
  const history = loadHistory();
  history.unshift(record);
  localStorage.setItem('imageProcessorHistory', JSON.stringify(history));
}

export function loadHistory(): HistoryRecord[] {
  const stored = localStorage.getItem('imageProcessorHistory');
  return stored ? JSON.parse(stored) : [];
}

export function clearHistory(): void {
  localStorage.removeItem('imageProcessorHistory');
}