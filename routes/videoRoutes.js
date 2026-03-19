const express = require("express");
const multer = require("multer");
const path = require("path");
const { processMedia } = require("../utils/ffmpeg");

const router = express.Router();

let uploadedFiles = []; // simple in-memory storage

// Storage config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Limit size per file
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
});

router.post("/upload", upload.array("files", 10), (req, res) => {
  try {
    const files = req.files;

    const paths = files.map((file) => file.path);

    uploadedFiles.push(...paths);

    res.json({
      message: "Files uploaded successfully",
      files: paths,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

router.post("/process", async (req, res) => {
  try {
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const outputPath = await processMedia(
      uploadedFiles.map((filePath) => ({
        path: filePath,
        originalname: path.basename(filePath),
      })),
    );

    uploadedFiles = [];

    res.json({
      message: "Processing complete",
      file: path.basename(outputPath),
      url: `/outputs/${path.basename(outputPath)}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Processing failed");
  }
});

router.get("/download/:file", (req, res) => {
  const filePath = path.join("outputs", req.params.file);
  res.download(filePath);
});

module.exports = router;
