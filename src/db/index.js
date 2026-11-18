import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";
// Node < 22 has no global WebSocket; the Pool driver needs one for transactions.
if (typeof WebSocket === "undefined")
    neonConfig.webSocketConstructor = ws;
const g = globalThis;
function create() {
    const url = process.env.DATABASE_URL;
    if (!url)
        throw new Error("DATABASE_URL is not set");
    return drizzle(new Pool({ connectionString: url }), { schema });
}
/** Lazy proxy so importing this module at build time never requires a DB. */
export const db = new Proxy({}, {
    get(_t, prop) {
        g.__db ??= create();
        const v = g.__db[prop];
        return typeof v === "function" ? v.bind(g.__db) : v;
    },
});
export { schema };
