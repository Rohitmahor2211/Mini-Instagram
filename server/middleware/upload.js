const multer = require('multer');
// const path = require('path');

// // Configure how and where files are saved
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         // Ensure this folder exists!
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         // Create a unique name: timestamp + original extension
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

const storage = multer.memoryStorage();

// Initialize multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        // const extension = path.extname(file.originalname).toLowerCase().slice(1);
        const mimetype = file.mimetype.split('/')[1];

        if (allowedTypes.test(mimetype)) {
            return cb(null, true);
        }
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed!"));
    }
});

module.exports = upload;