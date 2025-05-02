const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const uploadToCloudinary = async (file) => {
  try {
    let result;
    
    if (file.buffer) {
      // Handle buffer upload (from multer memory storage)
      result = await cloudinary.uploader.upload_stream({
        folder: 'chatwave',
        resource_type: 'auto'
      }, (error, result) => {
        if (error) throw error;
        return result;
      }).end(file.buffer);
    } else if (file.path) {
      // Handle file path upload
      result = await cloudinary.uploader.upload(file.path, {
        folder: 'chatwave',
        resource_type: 'auto'
      });
      
      // Delete file from local storage
      fs.unlinkSync(file.path);
    } else {
      throw new Error('Invalid file format');
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

module.exports = {
  uploadToCloudinary
};
