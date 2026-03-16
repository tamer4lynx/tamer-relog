import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveHostPaths } from '../common/hostConfig';

function deterministicUUID(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex').substring(0, 24).toUpperCase();
}

function getLaunchScreenStoryboard(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0"
    toolsVersion="13122.16" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none"
    useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES"
    colorMatched="YES" initialViewController="01J-lp-oVM">
  <device id="retina6_12" orientation="portrait" appearance="light"/>
  <dependencies>
    <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="13104.12"/>
    <capability name="Safe area layout guides" minToolsVersion="9.0"/>
    <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
  </dependencies>
  <scenes>
    <scene sceneID="EHf-IW-A2E">
      <objects>
        <viewController id="01J-lp-oVM" sceneMemberID="viewController">
          <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
            <rect key="frame" x="0.0" y="0.0" width="390" height="844"/>
            <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
            <subviews>
              <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="Bg9-1M-mhb">
                <rect key="frame" x="0.0" y="0.0" width="390" height="844"/>
                <color key="backgroundColor" white="0.0" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
              </view>
            </subviews>
            <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
            <color key="backgroundColor" white="0.0" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
            <constraints>
              <constraint firstItem="Bg9-1M-mhb" firstAttribute="top" secondItem="Ze5-6b-2t3" secondAttribute="top" id="3M4-v9-a3l"/>
              <constraint firstItem="Bg9-1M-mhb" firstAttribute="bottom" secondItem="Ze5-6b-2t3" secondAttribute="bottom" id="Sbc-LM-HvA"/>
              <constraint firstItem="Bg9-1M-mhb" firstAttribute="leading" secondItem="Ze5-6b-2t3" secondAttribute="leading" id="cJ0-4h-f4M"/>
              <constraint firstAttribute="trailing" secondItem="Bg9-1M-mhb" secondAttribute="trailing" id="g0s-pf-rxW"/>
            </constraints>
          </view>
        </viewController>
        <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
      </objects>
    </scene>
  </scenes>
</document>
`;
}

function addLaunchScreenToXcodeProject(pbxprojPath: string, appName: string): void {
    let content = fs.readFileSync(pbxprojPath, 'utf8');
    if (content.includes('LaunchScreen.storyboard')) return;

    const baseFileRefUUID = deterministicUUID(`launchScreenBase:${appName}`);
    const variantGroupUUID = deterministicUUID(`launchScreenGroup:${appName}`);
    const buildFileUUID = deterministicUUID(`launchScreenBuild:${appName}`);

    content = content.replace(
        '/* End PBXFileReference section */',
        `\t\t${baseFileRefUUID} /* Base */ = {isa = PBXFileReference; lastKnownFileType = file.storyboard; name = Base; path = Base.lproj/LaunchScreen.storyboard; sourceTree = "<group>"; };\n/* End PBXFileReference section */`
    );

    content = content.replace(
        '/* End PBXBuildFile section */',
        `\t\t${buildFileUUID} /* LaunchScreen.storyboard in Resources */ = {isa = PBXBuildFile; fileRef = ${variantGroupUUID} /* LaunchScreen.storyboard */; };\n/* End PBXBuildFile section */`
    );

    content = content.replace(
        '/* End PBXVariantGroup section */',
        `\t\t${variantGroupUUID} /* LaunchScreen.storyboard */ = {\n\t\t\tisa = PBXVariantGroup;\n\t\t\tchildren = (\n\t\t\t\t${baseFileRefUUID} /* Base */,\n\t\t\t);\n\t\t\tname = LaunchScreen.storyboard;\n\t\t\tsourceTree = "<group>";\n\t\t};\n/* End PBXVariantGroup section */`
    );

    content = content.replace(
        /(isa = PBXResourcesBuildPhase;[\s\S]*?files = \()/,
        `$1\n\t\t\t\t${buildFileUUID} /* LaunchScreen.storyboard in Resources */,`
    );

    const groupPattern = new RegExp(
        `(\\/\\* ${appName} \\*\\/ = \\{[\\s\\S]*?isa = PBXGroup;[\\s\\S]*?children = \\()`
    );
    content = content.replace(groupPattern, `$1\n\t\t\t\t${variantGroupUUID} /* LaunchScreen.storyboard */,`);

    fs.writeFileSync(pbxprojPath, content, 'utf8');
    console.log('✅ Registered LaunchScreen.storyboard in Xcode project');
}

export function addSwiftSourceToXcodeProject(pbxprojPath: string, appName: string, filename: string): void {
    let content = fs.readFileSync(pbxprojPath, 'utf8');

    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`path = ${escaped};`).test(content)) return;

    const fileRefUUID = deterministicUUID(`fileRef:${appName}:${filename}`);
    const buildFileUUID = deterministicUUID(`buildFile:${appName}:${filename}`);

    content = content.replace(
        '/* End PBXFileReference section */',
        `\t\t${fileRefUUID} /* ${filename} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${filename}; sourceTree = "<group>"; };\n/* End PBXFileReference section */`
    );

    content = content.replace(
        '/* End PBXBuildFile section */',
        `\t\t${buildFileUUID} /* ${filename} in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRefUUID} /* ${filename} */; };\n/* End PBXBuildFile section */`
    );

    content = content.replace(
        /(isa = PBXSourcesBuildPhase;[\s\S]*?files = \()/,
        `$1\n\t\t\t\t${buildFileUUID} /* ${filename} in Sources */,`
    );

    const groupPattern = new RegExp(
        `(\\/\\* ${appName} \\*\\/ = \\{[\\s\\S]*?isa = PBXGroup;[\\s\\S]*?children = \\()`
    );
    content = content.replace(groupPattern, `$1\n\t\t\t\t${fileRefUUID} /* ${filename} */,`);

    fs.writeFileSync(pbxprojPath, content, 'utf8');
    console.log(`✅ Registered ${filename} in Xcode project sources`);
}

export function addResourceToXcodeProject(pbxprojPath: string, appName: string, filename: string): void {
    let content = fs.readFileSync(pbxprojPath, 'utf8');

    const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`path = ${escaped};`).test(content)) return;

    const fileRefUUID = deterministicUUID(`fileRef:${appName}:${filename}`);
    const buildFileUUID = deterministicUUID(`buildFile:${appName}:${filename}`);

    content = content.replace(
        '/* End PBXFileReference section */',
        `\t\t${fileRefUUID} /* ${filename} */ = {isa = PBXFileReference; lastKnownFileType = file; path = ${filename}; sourceTree = "<group>"; };\n/* End PBXFileReference section */`
    );

    content = content.replace(
        '/* End PBXBuildFile section */',
        `\t\t${buildFileUUID} /* ${filename} in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefUUID} /* ${filename} */; };\n/* End PBXBuildFile section */`
    );

    content = content.replace(
        /(isa = PBXResourcesBuildPhase;[\s\S]*?files = \()/,
        `$1\n\t\t\t\t${buildFileUUID} /* ${filename} in Resources */,`
    );

    const groupPattern = new RegExp(
        `(\\/\\* ${appName} \\*\\/ = \\{[\\s\\S]*?isa = PBXGroup;[\\s\\S]*?children = \\()`
    );
    content = content.replace(groupPattern, `$1\n\t\t\t\t${fileRefUUID} /* ${filename} */,`);

    fs.writeFileSync(pbxprojPath, content, 'utf8');
    console.log(`✅ Registered ${filename} in Xcode project resources`);
}

function writeFile(filePath: string, content: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

function getAppDelegateSwift(): string {
    return `import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        LynxInitProcessor.shared.setupEnvironment()
        return true
    }

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
`;
}

function getSceneDelegateSwift(): string {
    return `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
    }
}
`;
}

function getViewControllerSwift(): string {
    return `import UIKit
import Lynx
import tamerinsets

class ViewController: UIViewController {
    private var lynxView: LynxView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        additionalSafeAreaInsets = .zero
        view.insetsLayoutMarginsFromSafeArea = false
        view.preservesSuperviewLayoutMargins = false
        viewRespectsSystemMinimumLayoutMargins = false
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard view.bounds.width > 0, view.bounds.height > 0 else { return }
        if lynxView == nil {
            setupLynxView()
        } else {
            applyFullscreenLayout(to: lynxView!)
        }
    }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        TamerInsetsModule.reRequestInsets()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    private func buildLynxView() -> LynxView {
        let bounds = view.bounds
        let lv = LynxView { builder in
            builder.config = LynxConfig(provider: LynxProvider())
            builder.screenSize = bounds.size
            builder.fontScale = 1.0
        }
        lv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        lv.insetsLayoutMarginsFromSafeArea = false
        lv.preservesSuperviewLayoutMargins = false
        applyFullscreenLayout(to: lv)
        return lv
    }

    private func setupLynxView() {
        let lv = buildLynxView()
        view.addSubview(lv)
        lv.loadTemplate(fromURL: "main.lynx.bundle", initData: nil)
        self.lynxView = lv
    }

    private func applyFullscreenLayout(to lynxView: LynxView) {
        let bounds = view.bounds
        let size = bounds.size
        lynxView.frame = bounds
        lynxView.updateScreenMetrics(withWidth: size.width, height: size.height)
        lynxView.updateViewport(withPreferredLayoutWidth: size.width, preferredLayoutHeight: size.height, needLayout: true)
        lynxView.preferredLayoutWidth = size.width
        lynxView.preferredLayoutHeight = size.height
        lynxView.layoutWidthMode = .exact
        lynxView.layoutHeightMode = .exact
    }
}
`;
}

function patchInfoPlist(infoPlistPath: string): void {
    if (!fs.existsSync(infoPlistPath)) return;
    let content = fs.readFileSync(infoPlistPath, 'utf8');

    content = content.replace(/\s*<key>UIMainStoryboardFile<\/key>\s*<string>[^<]*<\/string>/g, '');

    if (!content.includes('UILaunchStoryboardName')) {
        content = content.replace('</dict>\n</plist>', `\t<key>UILaunchStoryboardName</key>\n\t<string>LaunchScreen</string>\n</dict>\n</plist>`);
        console.log('✅ Added UILaunchStoryboardName to Info.plist');
    }

    if (!content.includes('UIApplicationSceneManifest')) {
        const sceneManifest = `\t<key>UIApplicationSceneManifest</key>
\t<dict>
\t\t<key>UIApplicationSupportsMultipleScenes</key>
\t\t<false/>
\t\t<key>UISceneConfigurations</key>
\t\t<dict>
\t\t\t<key>UIWindowSceneSessionRoleApplication</key>
\t\t\t<array>
\t\t\t\t<dict>
\t\t\t\t\t<key>UISceneConfigurationName</key>
\t\t\t\t\t<string>Default Configuration</string>
\t\t\t\t\t<key>UISceneDelegateClassName</key>
\t\t\t\t\t<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
\t\t\t\t</dict>
\t\t\t</array>
\t\t</dict>
\t</dict>`;
        content = content.replace('</dict>\n</plist>', `${sceneManifest}\n</dict>\n</plist>`);
        console.log('✅ Added UIApplicationSceneManifest to Info.plist');
    }

    fs.writeFileSync(infoPlistPath, content, 'utf8');
}

function syncHostIos(): void {
    const resolved = resolveHostPaths();
    const appName = resolved.config.ios?.appName;

    if (!appName) {
        throw new Error('"ios.appName" must be defined in tamer.config.json');
    }

    const projectDir = path.join(resolved.iosDir, appName);
    const appDelegatePath = path.join(projectDir, 'AppDelegate.swift');
    const sceneDelegatePath = path.join(projectDir, 'SceneDelegate.swift');
    const viewControllerPath = path.join(projectDir, 'ViewController.swift');
    const infoPlistPath = path.join(projectDir, 'Info.plist');

    if (!fs.existsSync(projectDir)) {
        throw new Error(`iOS project not found at ${projectDir}. Run \`tamer ios create\` first.`);
    }

    const pbxprojPath = path.join(resolved.iosDir, `${appName}.xcodeproj`, 'project.pbxproj');
    const baseLprojDir = path.join(projectDir, 'Base.lproj');
    const launchScreenPath = path.join(baseLprojDir, 'LaunchScreen.storyboard');

    patchInfoPlist(infoPlistPath);
    writeFile(appDelegatePath, getAppDelegateSwift());
    writeFile(sceneDelegatePath, getSceneDelegateSwift());
    writeFile(viewControllerPath, getViewControllerSwift());

    if (!fs.existsSync(launchScreenPath)) {
        fs.mkdirSync(baseLprojDir, { recursive: true });
        writeFile(launchScreenPath, getLaunchScreenStoryboard());
        addLaunchScreenToXcodeProject(pbxprojPath, appName);
    }

    addSwiftSourceToXcodeProject(pbxprojPath, appName, 'SceneDelegate.swift');

    console.log('✅ Synced iOS host app controller files');
}

export default syncHostIos;
