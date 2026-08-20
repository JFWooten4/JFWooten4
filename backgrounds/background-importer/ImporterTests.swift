import Foundation

@main
struct ImporterTests {
    static func main() throws {
        let fileManager = FileManager.default
        let fixtureRoot = URL(fileURLWithPath: fileManager.currentDirectoryPath, isDirectory: true)
        let testRoot = fileManager.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let backgrounds = testRoot.appendingPathComponent("backgrounds", isDirectory: true)
        try fileManager.createDirectory(at: backgrounds, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: testRoot) }

        try fileManager.copyItem(
            at: fixtureRoot.appendingPathComponent("backgrounds/README.md"),
            to: backgrounds.appendingPathComponent("README.md")
        )
        try fileManager.copyItem(
            at: fixtureRoot.appendingPathComponent("index.html"),
            to: testRoot.appendingPathComponent("index.html")
        )

        setenv("BACKGROUND_REPOSITORY", testRoot.path, 1)
        let added = try BackgroundRepository.add(BackgroundDetails(
            sourceFile: fixtureRoot.appendingPathComponent("backgrounds/background-importer/AppIcon.png"),
            filename: "Importer Test",
            artist: "Example Artist",
            artistURL: "https://example.com/artist",
            sourceURL: "https://example.com/art"
        ))

        precondition(added == "importer-test.png")
        precondition(fileManager.fileExists(atPath: backgrounds.appendingPathComponent(added).path))

        let readme = try String(contentsOf: backgrounds.appendingPathComponent("README.md"), encoding: .utf8)
        precondition(readme.contains("- `importer-test` comes from [Example Artist](https://example.com/artist) ([src](https://example.com/art))"))

        let index = try String(contentsOf: testRoot.appendingPathComponent("index.html"), encoding: .utf8)
        precondition(index.contains("lose-them,importer-test\" | split"))
        precondition(index.contains("\"importer-test\": {"))
        precondition(index.contains("\"artistUrl\": \"https://example.com/artist\""))
        precondition(index.contains("\"sourceUrl\": \"https://example.com/art\""))

        print("Background importer integration test passed.")
    }
}
