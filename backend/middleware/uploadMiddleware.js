const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Helper function to handle file upload
const handleFileUpload = async (file) => {
  try {
    // Try to upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'chatwave/profile-pics',
        width: 500,
        height: 500,
        crop: 'fill'
      });
      // Delete local file after successful upload
      fs.unlinkSync(file.path);
      return result.secure_url;
    } else {
      // If Cloudinary is not configured, use local storage
      const publicUrl = `/uploads/${path.basename(file.path)}`;
      return publicUrl;
    }
  } catch (error) {
    console.error('File upload error:', error);
    // If Cloudinary upload fails, fall back to local storage
    const publicUrl = `/uploads/${path.basename(file.path)}`;
    return publicUrl;
  }
};

module.exports = {
  upload,
  handleFileUpload
}; 