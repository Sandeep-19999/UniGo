const MAX_DATA_URL_BYTES = 1_500_000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image preview.'));
    image.src = dataUrl;
  });
}

async function compressImageToDataUrl(file) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);

  const maxWidth = 1400;
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let output = canvas.toDataURL('image/jpeg', quality);

  while (output.length > MAX_DATA_URL_BYTES && quality > 0.45) {
    quality -= 0.1;
    output = canvas.toDataURL('image/jpeg', quality);
  }

  if (output.length > MAX_DATA_URL_BYTES) {
    throw new Error('Image is still too large after compression. Try a smaller image.');
  }

  return {
    fileUrl: output,
    fileName: file.name.replace(/\.[^.]+$/, '.jpg'),
    mimeType: 'image/jpeg'
  };
}

export async function prepareDocumentPayload(file) {
  if (!file) {
    throw new Error('Please choose a file first.');
  }

  if (file.type.startsWith('image/')) {
    return compressImageToDataUrl(file);
  }

  if (file.size > MAX_DATA_URL_BYTES) {
    throw new Error('This file is too large for the current document API. Use a smaller file or an image version.');
  }

  const fileUrl = await readFileAsDataUrl(file);
  return {
    fileUrl,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream'
  };
}
