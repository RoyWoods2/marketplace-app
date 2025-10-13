const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'marketplace') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload video to Cloudinary
const uploadVideo = async (file, folder = 'marketplace/videos') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'video',
      transformation: [
        { width: 720, height: 1280, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw new Error('Failed to upload video');
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};

// Generate thumbnail from video
const generateThumbnail = async (videoUrl) => {
  try {
    const result = await cloudinary.url(videoUrl, {
      resource_type: 'video',
      transformation: [
        { width: 300, height: 400, crop: 'limit' },
        { quality: 'auto' },
        { format: 'jpg' }
      ]
    });
    
    return result;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteFile,
  generateThumbnail
};

