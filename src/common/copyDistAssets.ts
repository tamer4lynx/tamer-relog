import fs from 'fs';
import path from 'path';

const SKIP = new Set(['.rspeedy', 'stats.json']);

export function copyDistAssets(distDir: string, destDir: string, bundleFile: string): void {
    if (!fs.existsSync(distDir)) return;
    for (const entry of fs.readdirSync(distDir)) {
        if (SKIP.has(entry)) continue;
        const src = path.join(distDir, entry);
        const dest = path.join(destDir, entry);
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            copyDistAssets(src, dest, bundleFile);
        } else {
            fs.copyFileSync(src, dest);
            if (entry !== bundleFile) {
                console.log(`✨ Copied asset: ${entry}`);
            }
        }
    }
}
