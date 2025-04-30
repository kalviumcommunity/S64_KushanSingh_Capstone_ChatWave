const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const uploadToCloudinary = async (file) => {
  try {
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'chatwave',
      resource_type: 'auto'
    });

    // Delete file from local storage
    fs.unlinkSync(file.path);

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

module.exports = {
  uploadToCloudinary
};
