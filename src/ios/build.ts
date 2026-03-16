import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { resolveHostPaths, resolveDevAppPaths, findRepoRoot } from '../common/hostConfig';
import ios_bundle from './bundle';
import syncDevClientIos from './syncDevClient';

const DEV_APP_NAME = 'TamerDevApp';
const SIMULATOR_ID = 'A07F36D8-873A-41E0-8B90-3DF328A6B614';

function findBootedSimulator(): string | null {
    try {
        const out = execSync('xcrun simctl list devices --json', { encoding: 'utf8' });
        const json = JSON.parse(out);
        for (const runtimes of Object.values(json.devices) as any[][]) {
            for (const device of runtimes) {
                if (device.state === 'Booted') return device.udid as string;
            }
        }
    } catch {}
    return null;
}

async function buildIpa(opts: { target?: string; install?: boolean; release?: boolean } = {}) {
    const target = opts.target ?? 'host';
    const resolved = resolveHostPaths();
    if (!resolved.config.ios?.appName) {
        throw new Error('"ios.appName" must be defined in tamer.config.json');
    }

    if (target === 'dev-app') {
        await buildIosDevApp(opts.install, opts.release);
        return;
    }

    const appName = resolved.config.ios.appName;
    const bundleId = resolved.config.ios.bundleId;
    const iosDir = resolved.iosDir;
    const configuration = opts.release ? 'Release' : 'Debug';

    ios_bundle({ target, release: opts.release });

    const scheme = appName;
    const workspacePath = path.join(iosDir, `${appName}.xcworkspace`);
    const projectPath = path.join(iosDir, `${appName}.xcodeproj`);
    const xcproject = fs.existsSync(workspacePath) ? workspacePath : projectPath;
    const flag = xcproject.endsWith('.xcworkspace') ? '-workspace' : '-project';
    const derivedDataPath = path.join(iosDir, 'build');

    const sdk = opts.install ? 'iphonesimulator' : 'iphoneos';
    console.log(`\n🔨 Building ${configuration} (${sdk})...`);
    execSync(
        `xcodebuild ${flag} "${xcproject}" -scheme "${scheme}" -configuration ${configuration} -sdk ${sdk} -derivedDataPath "${derivedDataPath}"`,
        { stdio: 'inherit', cwd: iosDir }
    );
    console.log(`✅ Build completed.`);

    if (opts.install) {
        const appGlob = path.join(
            derivedDataPath,
            'Build', 'Products', `${configuration}-iphonesimulator`, `${appName}.app`
        );
        if (!fs.existsSync(appGlob)) {
            console.error(`❌ Built app not found at: ${appGlob}`);
            process.exit(1);
        }

        const udid = findBootedSimulator();
        if (!udid) {
            console.error('❌ No booted simulator found. Start one with: xcrun simctl boot <udid>');
            process.exit(1);
        }

        console.log(`📲 Installing on simulator ${udid}...`);
        execSync(`xcrun simctl install "${udid}" "${appGlob}"`, { stdio: 'inherit' });

        if (bundleId) {
            console.log(`🚀 Launching ${bundleId}...`);
            execSync(`xcrun simctl launch "${udid}" "${bundleId}"`, { stdio: 'inherit' });
            console.log('✅ App launched.');
        } else {
            console.log('✅ App installed. (Set "ios.bundleId" in tamer.config.json to auto-launch.)');
        }
    }
}

async function buildIosDevApp(install?: boolean, release?: boolean) {
    const repoRoot = findRepoRoot(process.cwd());
    const resolved = resolveDevAppPaths(repoRoot);
    const iosDir = resolved.iosDir;
    const configuration = release ? 'Release' : 'Debug';

    await syncDevClientIos();

    const workspacePath = path.join(iosDir, `${DEV_APP_NAME}.xcworkspace`);
    const projectPath = path.join(iosDir, `${DEV_APP_NAME}.xcodeproj`);
    const xcproject = fs.existsSync(workspacePath) ? workspacePath : projectPath;
    const flag = xcproject.endsWith('.xcworkspace') ? 'workspace' : 'project';

    console.log(`\n🔨 Building TamerDevApp for simulator (${configuration})...`);
    execSync(
        `xcodebuild -${flag} "${xcproject}" -scheme "${DEV_APP_NAME}" -configuration ${configuration} ` +
        `-sdk iphonesimulator -destination "platform=iOS Simulator,name=iPhone 16 Pro,OS=18.5" ` +
        `-derivedDataPath build`,
        { stdio: 'inherit', cwd: iosDir }
    );
    console.log('✅ TamerDevApp built successfully.');

    if (install) {
        const appPath = path.join(iosDir, 'build', 'Build', 'Products', `${configuration}-iphonesimulator`, `${DEV_APP_NAME}.app`);
        console.log('\n📲 Installing to simulator...');
        try { execSync(`xcrun simctl boot "${SIMULATOR_ID}" 2>/dev/null`); } catch { /* already booted */ }
        execSync(`xcrun simctl install "${SIMULATOR_ID}" "${appPath}"`, { stdio: 'inherit' });
        execSync(`xcrun simctl launch "${SIMULATOR_ID}" "com.nanofuxion.tamerdevapp"`, { stdio: 'inherit' });
        execSync('open -a Simulator', { stdio: 'inherit' });
        console.log('✅ TamerDevApp launched in simulator.');
    }
}

export default buildIpa;
