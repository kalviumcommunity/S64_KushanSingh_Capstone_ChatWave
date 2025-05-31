const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup multer storage
const storage = multer.memoryStorage();  // Store the file in memory
const upload = multer({ storage }).single('file'); // Accept single file uploads

// Middleware to upload media to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      // Convert the buffer into a readable stream using streamifier
      const stream = streamifier.createReadStream(file.buffer);

      // Upload image/file to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);  // Log error for better diagnostics
            reject(new Error('File upload to Cloudinary failed.'));
          } else if (!result || !result.secure_url) {
            reject(new Error('No result returned from Cloudinary.'));
          } else {
            resolve(result); // Resolve with the result object
          }
        }
      );

      // Pipe the stream to Cloudinary
      stream.pipe(uploadStream);

    } catch (error) {
      console.error("Error in Cloudinary upload:", error);  // Log any unexpected errors
      reject(new Error('Error uploading file to Cloudinary.'));
    }
  });
};

module.exports = { uploadToCloudinary };
