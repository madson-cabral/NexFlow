import {env} from "cloudflare:workers";
export function getBinding():D1Database{if(!env.DB)throw new Error("Database unavailable");return env.DB;}
