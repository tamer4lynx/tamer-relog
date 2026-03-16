import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { resolveHostPaths, resolveDevAppPaths } from '../common/hostConfig';
import android_bundle from './bundle';

function findRepoRoot(start: string): string {
    let dir = path.resolve(start);
    const root = path.parse(dir).root;
    while (dir !== root) {
        const pkgPath = path.join(dir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                if (pkg.workspaces) return dir;
            } catch {}
        }
        dir = path.dirname(dir);
    }
    return start;
}

async function buildApk(opts: { install?: boolean; target?: string; release?: boolean } = {}) {
    const target = opts.target ?? 'host';
    const resolved = target === 'dev-app'
        ? resolveDevAppPaths(findRepoRoot(process.cwd()))
        : resolveHostPaths();

    await android_bundle({ target, release: opts.release });

    const androidDir = resolved.androidDir;
    const gradlew = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
    const variant = opts.release ? 'Release' : 'Debug';
    const task = opts.install ? `install${variant}` : `assemble${variant}`;
    console.log(`\n🔨 Building ${variant.toLowerCase()} APK${opts.install ? ' and installing' : ''}...`);
    execSync(`"${gradlew}" ${task}`, { stdio: 'inherit', cwd: androidDir });
    console.log(`✅ APK ${opts.install ? 'installed' : 'built'} successfully.`);

    if (opts.install) {
        const packageName = resolved.config.android?.packageName;
        if (packageName) {
            try {
                console.log(`🚀 Launching ${packageName}...`);
                execSync(`adb shell am start -n ${packageName}/.MainActivity`, { stdio: 'inherit' });
                console.log('✅ App launched.');
            } catch (e) {
                console.warn('⚠️ Could not launch app. Is a device/emulator connected?');
            }
        } else {
            console.log('ℹ️ Set "android.packageName" in tamer.config.json to auto-launch.');
        }
    }
}

export default buildApk;
