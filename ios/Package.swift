// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "ForjaCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "ForjaCore", targets: ["ForjaCore"]),
        .executable(name: "forja-core-checks", targets: ["ForjaCoreChecks"])
    ],
    targets: [
        .target(
            name: "ForjaCore",
            path: "ForjaApp/Core"
        ),
        .executableTarget(
            name: "ForjaCoreChecks",
            dependencies: ["ForjaCore"],
            path: "Tools/CoreChecks"
        ),
        .testTarget(
            name: "ForjaCoreTests",
            dependencies: ["ForjaCore"],
            path: "Tests/ForjaCoreTests"
        )
    ],
    swiftLanguageModes: [.v5]
)
