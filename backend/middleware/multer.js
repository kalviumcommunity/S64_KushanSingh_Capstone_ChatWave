const multer = require('multer');
const path = require('path');

// Allowed file types
const FILE_TYPES = /jpeg|jpg|png|webp/;

// Storage - in memory (can be changed to disk if needed)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const extname = FILE_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = FILE_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)!'));
  }
};

// Upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max file size
  fileFilter,
});

module.exports = upload;
