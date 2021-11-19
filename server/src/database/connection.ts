import logger from "@shared/Logger";
import mongoose from "mongoose";
const URI = process.env.MONGO_URI || "";

const connect = async () => {
  const connection = await mongoose.connect(URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    directConnection: true,
  });
  logger.warn(
    `connected ${connection.connection.host}:${connection.connection.port}`,
    true
  );
};

export { connect };
