const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const OUTPUT_DIR = "outputs";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const processMedia = async (files) => {
  return new Promise(async (resolve, reject) => {
    const tempVideos = [];

    for (let file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const outputVideo = path.join("uploads", `${uuidv4()}.mp4`);

      // If image → convert to video
      if ([".jpg", ".png", ".jpeg"].includes(ext)) {
        await new Promise((res, rej) => {
          ffmpeg(file.path)
            .loop(3) // 3 seconds per image
            .fps(25)
            // .size("1280x720")
            .videoFilters([
              "scale=1280:720:force_original_aspect_ratio=decrease",
              "pad=1280:720:(ow-iw)/2:(oh-ih)/2",
              "fade=t=in:st=0:d=0.5",
              "fade=t=out:st=2.5:d=0.5",
            ])
            .output(outputVideo)
            .on("end", res)
            .on("error", rej)
            .run();
        });
      } else {
        // Normalize video
        const duration = await getDuration(file.path);
        await new Promise((res, rej) => {
          ffmpeg(file.path)
            // .size("1280x720")
            .videoFilters([
              "scale=1280:720:force_original_aspect_ratio=decrease",
              "pad=1280:720:(ow-iw)/2:(oh-ih)/2",
              "fade=t=in:st=0:d=0.5",
              `fade=t=out:st=${duration - 0.5}:d=0.5`,
            ])
            .output(outputVideo)
            .on("end", res)
            .on("error", rej)
            .run();
        });
      }

      tempVideos.push(outputVideo);
    }

    // Create concat file
    const concatFile = path.join("uploads", `${uuidv4()}.txt`);
    const concatContent = tempVideos
      .map((v) => `file '${path.resolve(v)}'`)
      .join("\n");

    fs.writeFileSync(concatFile, concatContent);

    const finalOutput = path.join(OUTPUT_DIR, `${uuidv4()}.mp4`);

    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c:v libx264", "-c:a aac", "-preset veryfast"]) // FIX: This can break if video dont match encoding exactly (["-c:v libx264", "-c:a"])
      .output(finalOutput)
      .on("end", () => resolve(finalOutput))
      .on("error", reject)
      .run();
  });
};

module.exports = { processMedia };
