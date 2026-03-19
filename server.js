const express = require("express");
const cors = require("cors");
const videoRoute = require("./routes/videoRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/uploads", express.static("uploads"));
app.use("/outputs", express.static("outputs"));

app.use("/api/video", videoRoute);

const PORT = 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
