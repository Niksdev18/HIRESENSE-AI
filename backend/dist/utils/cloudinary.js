"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadBuffer = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const isCloudinaryConfigured = !!(env_1.env.CLOUDINARY_CLOUD_NAME &&
    env_1.env.CLOUDINARY_API_KEY &&
    env_1.env.CLOUDINARY_API_SECRET);
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.env.CLOUDINARY_API_KEY,
        api_secret: env_1.env.CLOUDINARY_API_SECRET,
    });
    console.log('☁️ Cloudinary configured successfully.');
}
else {
    console.warn('⚠️ Cloudinary environment variables are missing. Falling back to local storage.');
}
const uploadBuffer = async (buffer, folder, originalName) => {
    if (isCloudinaryConfigured) {
        return new Promise((resolve, reject) => {
            const sanitizedName = originalName
                .replace(/\.[^/.]+$/, '') // remove extension
                .replace(/[^a-zA-Z0-9]/g, '_'); // remove special chars
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'auto',
                public_id: `${sanitizedName}_${Date.now()}`,
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error('Cloudinary upload result is undefined'));
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            });
            uploadStream.end(buffer);
        });
    }
    else {
        // Local storage fallback
        const uploadsDir = path_1.default.join(__dirname, '../../public/uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName}`;
        const filePath = path_1.default.join(uploadsDir, uniqueName);
        await fs_1.default.promises.writeFile(filePath, buffer);
        return {
            url: `/uploads/${uniqueName}`,
            publicId: uniqueName,
        };
    }
};
exports.uploadBuffer = uploadBuffer;
const deleteFile = async (publicId) => {
    try {
        if (isCloudinaryConfigured) {
            if (publicId && !publicId.startsWith('http')) {
                await cloudinary_1.v2.uploader.destroy(publicId);
            }
        }
        else {
            // Local storage delete
            const filePath = path_1.default.join(__dirname, '../../public/uploads', publicId);
            if (fs_1.default.existsSync(filePath)) {
                await fs_1.default.promises.unlink(filePath);
            }
        }
    }
    catch (error) {
        console.error('Failed to delete file:', error);
    }
};
exports.deleteFile = deleteFile;
