import fs from 'fs';
import path from 'path';
import { hasExtensionConfig, loadExtensionConfig, type NormalizedExtensionConfig } from './config';

export interface DiscoveredModule {
    name: string;
    config: NormalizedExtensionConfig;
    packagePath: string;
}

function resolveNodeModulesPath(projectRoot: string): string {
    let nodeModulesPath = path.join(projectRoot, 'node_modules');
    const workspaceRoot = path.join(projectRoot, '..', '..');
    const rootNodeModules = path.join(workspaceRoot, 'node_modules');
    if (
        fs.existsSync(path.join(workspaceRoot, 'package.json')) &&
        fs.existsSync(rootNodeModules) &&
        path.basename(path.dirname(projectRoot)) === 'packages'
    ) {
        nodeModulesPath = rootNodeModules;
    } else if (!fs.existsSync(nodeModulesPath)) {
        const altRoot = path.join(projectRoot, '..', '..');
        const altNodeModules = path.join(altRoot, 'node_modules');
        if (fs.existsSync(path.join(altRoot, 'package.json')) && fs.existsSync(altNodeModules)) {
            nodeModulesPath = altNodeModules;
        }
    }
    return nodeModulesPath;
}

export function discoverModules(projectRoot: string): DiscoveredModule[] {
    const nodeModulesPath = resolveNodeModulesPath(projectRoot);
    const packages: DiscoveredModule[] = [];

    if (!fs.existsSync(nodeModulesPath)) {
        return [];
    }

    const packageDirs = fs.readdirSync(nodeModulesPath);

    for (const dirName of packageDirs) {
        const fullPath = path.join(nodeModulesPath, dirName);
        const checkPackage = (name: string, packagePath: string) => {
            if (!hasExtensionConfig(packagePath)) return;
            const config = loadExtensionConfig(packagePath);
            if (!config || (!config.android && !config.ios)) return;
            packages.push({ name, config, packagePath });
        };

        if (dirName.startsWith('@')) {
            try {
                const scopedDirs = fs.readdirSync(fullPath);
                for (const scopedDirName of scopedDirs) {
                    const scopedPackagePath = path.join(fullPath, scopedDirName);
                    checkPackage(`${dirName}/${scopedDirName}`, scopedPackagePath);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                console.warn(`⚠️ Could not read scoped package directory ${fullPath}: ${msg}`);
            }
        } else {
            checkPackage(dirName, fullPath);
        }
    }

    return packages;
}
