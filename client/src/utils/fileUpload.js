const MAX_FILE_SIZE = 8 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

export function validateDocumentFile(file) {
  if (!file) {
    throw new Error("Please choose a file first.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, and PDF files are allowed.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 8MB.");
  }

  return true;
}
