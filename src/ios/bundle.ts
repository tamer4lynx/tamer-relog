import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { resolveHostPaths, resolveDevMode, findDevClientPackage } from '../common/hostConfig';
import { copyDistAssets } from '../common/copyDistAssets';
import ios_autolink from './autolink';
import syncHostIos, { addResourceToXcodeProject } from './syncHost';

function bundleAndDeploy(opts: { target?: string; release?: boolean } = {}) {
    const target = opts.target ?? 'host';
    const release = opts.release === true;
    let resolved: ReturnType<typeof resolveHostPaths>;
    try {
        resolved = resolveHostPaths();
        if (!resolved.config.ios?.appName) {
            throw new Error('"ios.appName" must be defined in tamer.config.json');
        }
    } catch (error: any) {
        console.error(`❌ Error loading configuration: ${error.message}`);
        process.exit(1);
    }

    const appName = resolved.config.ios!.appName!;
    const sourceBundlePath = resolved.lynxBundlePath;
    const destinationDir = path.join(resolved.iosDir, appName);
    const destinationBundlePath = path.join(destinationDir, resolved.lynxBundleFile);
    const devMode = resolveDevMode(resolved.config);

    if (target === 'dev-app') {
        console.error('❌ iOS dev-app target not yet implemented.');
        process.exit(1);
    }

    syncHostIos({ release });
    ios_autolink();

    try {
        console.log('📦 Building Lynx bundle...');
        execSync('npm run build', { stdio: 'inherit', cwd: resolved.lynxProjectDir });
        console.log('✅ Build completed successfully.');
    } catch (error) {
        console.error('❌ Build process failed. Please check the errors above.');
        process.exit(1);
    }

    try {
        if (!fs.existsSync(sourceBundlePath)) {
            console.error(`❌ Build output not found at: ${sourceBundlePath}`);
            process.exit(1);
        }

        if (!fs.existsSync(destinationDir)) {
            console.error(`Destination directory not found at: ${destinationDir}`);
            process.exit(1);
        }

        const distDir = path.dirname(sourceBundlePath);
        console.log(`🚚 Copying bundle and assets to iOS project...`);
        copyDistAssets(distDir, destinationDir, resolved.lynxBundleFile);
        console.log(`✨ Successfully copied bundle to: ${destinationBundlePath}`);

        const pbxprojPath = path.join(resolved.iosDir, `${appName}.xcodeproj`, 'project.pbxproj');
        if (fs.existsSync(pbxprojPath)) {
            const skip = new Set(['.rspeedy', 'stats.json']);
            for (const entry of fs.readdirSync(distDir)) {
                if (skip.has(entry) || fs.statSync(path.join(distDir, entry)).isDirectory()) continue;
                addResourceToXcodeProject(pbxprojPath, appName, entry);
            }
        }

        if (devMode === 'embedded') {
            const devClientBundle = path.join(destinationDir, 'dev-client.lynx.bundle');
            if (!release) {
                const devClientPkg = findDevClientPackage(resolved.projectRoot);
                if (devClientPkg) {
                    console.log('📦 Building dev-client bundle...');
                    try {
                        execSync('npm run build', { stdio: 'inherit', cwd: devClientPkg });
                    } catch {
                        console.warn('⚠️  dev-client build failed; skipping dev-client bundle');
                    }
                    const builtBundle = path.join(devClientPkg, 'dist', 'dev-client.lynx.bundle');
                    if (fs.existsSync(builtBundle)) {
                        fs.copyFileSync(builtBundle, devClientBundle);
                        console.log('✨ Copied dev-client.lynx.bundle to iOS project');
                        const pbxprojPath = path.join(resolved.iosDir, `${appName}.xcodeproj`, 'project.pbxproj');
                        if (fs.existsSync(pbxprojPath)) {
                            addResourceToXcodeProject(pbxprojPath, appName, 'dev-client.lynx.bundle');
                        }
                    }
                }
            } else {
                // Ensure a placeholder exists so Xcode doesn't fail on a missing file reference
                if (!fs.existsSync(devClientBundle)) {
                    fs.writeFileSync(devClientBundle, '');
                }
                console.log('ℹ️  Skipped dev-client bundle (release build)');
            }
        }
    } catch (error: any) {
        console.error('❌ Failed to copy bundle assets.');
        console.error(error.message);
        process.exit(1);
    }
}

export default bundleAndDeploy;