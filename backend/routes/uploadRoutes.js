const express = require('express');
const multer = require('multer');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

const router = express.Router();

// Multer setup (to handle multipart/form-data)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload the file buffer to Cloudinary
    const uploaded = await uploadToCloudinary(req.file);

    res.status(201).json({
      message: 'File uploaded successfully!',
      url: uploaded.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
});

module.exports = router;
