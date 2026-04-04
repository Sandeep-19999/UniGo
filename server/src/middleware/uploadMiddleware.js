import multer from "multer";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed."));
  }
  cb(null, true);
}

export const driverDocumentUpload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter
}).single("file");
