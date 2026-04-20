import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDir(uploadsRoot);
      cb(null, uploadsRoot);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === "resume" && file.mimetype === "application/pdf") {
    cb(null, true);
    return;
  }

  if (file.fieldname === "photo" && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Invalid file type!"), false);
};

const imageFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const jobFilesDir = path.join(uploadsRoot, "job-files");

const jobFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDir(jobFilesDir);
      cb(null, jobFilesDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `job-file-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const jobFileFilter = (_req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "text/plain"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Invalid file type! Only PDF, DOC, DOCX, TXT and images are allowed."), false);
};

const uploadJobFiles = multer({
  storage: jobFileStorage,
  fileFilter: jobFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter
}).single("image");

export { upload, uploadJobFiles, uploadImage };
