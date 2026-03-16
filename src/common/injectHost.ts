import fs from 'fs';
import path from 'path';
import { loadHostConfig, findTamerHostPackage } from './hostConfig';

function readAndSubstitute(
    templatePath: string,
    vars: Record<string, string>
): string {
    const raw = fs.readFileSync(templatePath, 'utf-8');
    return Object.entries(vars).reduce(
        (s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
        raw
    );
}

export async function injectHostAndroid(opts?: { force?: boolean }): Promise<void> {
    const config = loadHostConfig();
    const packageName = config.android?.packageName;
    const appName = config.android?.appName ?? 'App';
    if (!packageName) {
        console.error('❌ android.packageName required in tamer.config.json');
        process.exit(1);
    }

    const projectRoot = process.cwd();
    const hostPkg = findTamerHostPackage(projectRoot);
    if (!hostPkg) {
        console.error('❌ tamer-host not found. Install it: npm install tamer-host');
        process.exit(1);
    }

    const androidDir = config.paths?.androidDir ?? 'android';
    const rootDir = path.join(projectRoot, androidDir);
    const packagePath = packageName.replace(/\./g, '/');
    const javaDir = path.join(rootDir, 'app', 'src', 'main', 'java', packagePath);
    const kotlinDir = path.join(rootDir, 'app', 'src', 'main', 'kotlin', packagePath);

    if (!fs.existsSync(javaDir) || !fs.existsSync(kotlinDir)) {
        console.error('❌ Android project not found. Run `t4l android create` first or ensure android/ exists.');
        process.exit(1);
    }

    const templateDir = path.join(hostPkg, 'android', 'templates');
    const vars = { PACKAGE_NAME: packageName, APP_NAME: appName };
    const files: { src: string; dst: string }[] = [
        { src: 'App.java', dst: path.join(javaDir, 'App.java') },
        { src: 'TemplateProvider.java', dst: path.join(javaDir, 'TemplateProvider.java') },
        { src: 'MainActivity.kt', dst: path.join(kotlinDir, 'MainActivity.kt') },
    ];

    for (const { src, dst } of files) {
        const srcPath = path.join(templateDir, src);
        if (!fs.existsSync(srcPath)) continue;
        if (fs.existsSync(dst) && !opts?.force) {
            console.log(`⏭️  Skipping ${path.basename(dst)} (use --force to overwrite)`);
            continue;
        }
        const content = readAndSubstitute(srcPath, vars);
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.writeFileSync(dst, content);
        console.log(`✅ Injected ${path.basename(dst)}`);
    }
}

export async function injectHostIos(opts?: { force?: boolean }): Promise<void> {
    const config = loadHostConfig();
    const appName = config.ios?.appName;
    const bundleId = config.ios?.bundleId ?? 'com.example.app';
    if (!appName) {
        console.error('❌ ios.appName required in tamer.config.json');
        process.exit(1);
    }

    const projectRoot = process.cwd();
    const hostPkg = findTamerHostPackage(projectRoot);
    if (!hostPkg) {
        console.error('❌ tamer-host not found. Install it: npm install tamer-host');
        process.exit(1);
    }

    const iosDir = config.paths?.iosDir ?? 'ios';
    const rootDir = path.join(projectRoot, iosDir);
    const projectDir = path.join(rootDir, appName);

    if (!fs.existsSync(projectDir)) {
        console.error('❌ iOS project not found. Run `t4l ios create` first or ensure ios/ exists.');
        process.exit(1);
    }

    const templateDir = path.join(hostPkg, 'ios', 'templates');
    const vars = { PACKAGE_NAME: bundleId, APP_NAME: appName, BUNDLE_ID: bundleId };
    const files = [
        'AppDelegate.swift',
        'SceneDelegate.swift',
        'ViewController.swift',
        'LynxProvider.swift',
        'LynxInitProcessor.swift',
    ];

    for (const f of files) {
        const srcPath = path.join(templateDir, f);
        const dstPath = path.join(projectDir, f);
        if (!fs.existsSync(srcPath)) continue;
        if (fs.existsSync(dstPath) && !opts?.force) {
            console.log(`⏭️  Skipping ${f} (use --force to overwrite)`);
            continue;
        }
        const content = readAndSubstitute(srcPath, vars);
        fs.writeFileSync(dstPath, content);
        console.log(`✅ Injected ${f}`);
    }
}
