const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer   - File bytes
 * @param {string} folder   - e.g. 'resumes' or 'job_descriptions'
 * @param {string} publicId - Filename without extension
 * @returns {Promise<string>} - Public secure_url
 */
function uploadBuffer(buffer, folder, publicId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: 'raw',
                use_filename: true,
                unique_filename: false,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
}

module.exports = { cloudinary, uploadBuffer };
