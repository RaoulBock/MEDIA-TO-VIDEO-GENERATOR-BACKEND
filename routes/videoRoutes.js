const express = require("express");
const multer = require("multer");
const path = require("path");
const { processMedia } = require("../utils/ffmpeg");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    const outputPath = await processMedia(files);

    res.download(outputPath, "final-video.mp4");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing media");
  }
});

module.exports = router;
