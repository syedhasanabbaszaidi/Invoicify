import "dotenv/config";
import { seedDemo } from "./seed";
seedDemo().then((r) => { console.log("Seed complete:", r); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
