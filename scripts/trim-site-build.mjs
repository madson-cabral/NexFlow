import {existsSync, readFileSync, readdirSync, rmSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
// Keep the original artwork in source. Only omit superseded, unused videos
// from the deployment bundle so the complete archive fits the upload limit.
const supersededVideos = ["hero-flow-original-hq.mp4", "hero-flow-original-mobile.mp4"];
function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(filename) : /\.(css|tsx?|m?js)$/.test(entry.name) ? [filename] : [];
  });
}
const sources = ["app", "components", "lib"].flatMap(directory => sourceFiles(path.join(project, directory)));
for (const asset of supersededVideos) {
  if (sources.some(filename => readFileSync(filename, "utf8").includes(asset))) continue;
  rmSync(path.join(project, "dist/client/assets", asset), {force: true});
}
