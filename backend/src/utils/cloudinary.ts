import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ Cloudinary configured successfully.');
} else {
  console.warn(
    '⚠️ Cloudinary environment variables are missing. Falling back to local storage.'
  );
}

export const uploadBuffer = async (
  buffer: Buffer,
  folder: string,
  originalName: string
): Promise<{ url: string; publicId: string }> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const sanitizedName = originalName
        .replace(/\.[^/.]+$/, '') // remove extension
        .replace(/[^a-zA-Z0-9]/g, '_'); // remove special chars

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `${sanitizedName}_${Date.now()}`,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload result is undefined'));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(buffer);
    });
  } else {
    // Local storage fallback
    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/uploads/${uniqueName}`,
      publicId: uniqueName,
    };
  }
};

export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    if (isCloudinaryConfigured) {
      if (publicId && !publicId.startsWith('http')) {
        await cloudinary.uploader.destroy(publicId);
      }
    } else {
      // Local storage delete
      const filePath = path.join(__dirname, '../../public/uploads', publicId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
};
