import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
const serverEnvPath = fileURLToPath(new URL("../../.env", import.meta.url));

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath, override: true });
