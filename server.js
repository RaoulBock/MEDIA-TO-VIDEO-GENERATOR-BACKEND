const express = require("express");
const cors = require("cors");
const videoRoute = require("./routes/videoRoutes")

const app = express();
app.use(cors());

app.use("/api/video", videoRoute);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
