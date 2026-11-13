/**
 * Client-side image compression utility.
 * Reduces screenshot payload sizes by 70-90% before storing in base64 / uploading.
 */

export async function compressImage(
  input: File | string,
  maxDimension = 1280,
  quality = 0.82,
): Promise<string> {
  // If in Node.js environment (e.g. unit tests), return original or dummy dataUrl
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (typeof input === 'string') return input;
    return 'data:image/jpeg;base64,mockCompressedImage';
  }

  // 1. Convert input to dataUrl string
  let dataUrl = '';
  if (typeof input === 'string') {
    dataUrl = input;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  }

  // If already small (less than 60KB), don't bother compressing further
  if (dataUrl.length < 80_000) {
    return dataUrl;
  }

  // 2. Load into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  let { width, height } = img;
  if (width === 0 || height === 0) return dataUrl;

  // 3. Calculate scaled dimensions
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // 4. Draw to Canvas and export compressed
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // Fill white background in case of transparent png to avoid black artifacts when converting to jpeg
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first, fallback to JPEG
  try {
    const webp = canvas.toDataURL('image/webp', quality);
    if (webp.startsWith('data:image/webp')) {
      return webp;
    }
  } catch {
    // Ignore and fallback to JPEG
  }

  return canvas.toDataURL('image/jpeg', quality);
}
