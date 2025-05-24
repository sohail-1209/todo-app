import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadFile = (req, res) => {
  try {
    console.log('Upload request received. Files:', req.file);
    
    if (!req.file) {
      console.error('No file was included in the upload request');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded. Please select an image file.' 
      });
    }

    // Log file details for debugging
    console.log('File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    });

    // Construct the URL to access the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('File URL:', fileUrl);
    
    res.status(200).json({ 
      success: true, 
      url: fileUrl,
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error uploading file',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
