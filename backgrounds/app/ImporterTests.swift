import Foundation

@main
struct ImporterTests {
    static func main() throws {
        let fileManager = FileManager.default
        let fixtureRoot = URL(fileURLWithPath: fileManager.currentDirectoryPath, isDirectory: true)
        let testContainer = fileManager.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let testRoot = testContainer.appendingPathComponent("repository", isDirectory: true)
        let remote = testContainer.appendingPathComponent("remote.git", isDirectory: true)
        let backgrounds = testRoot.appendingPathComponent("backgrounds", isDirectory: true)
        try fileManager.createDirectory(at: backgrounds, withIntermediateDirectories: true)
        defer { try? fileManager.removeItem(at: testContainer) }

        try fileManager.copyItem(
            at: fixtureRoot.appendingPathComponent("backgrounds/README.md"),
            to: backgrounds.appendingPathComponent("README.md")
        )
        try fileManager.copyItem(
            at: fixtureRoot.appendingPathComponent("index.html"),
            to: testRoot.appendingPathComponent("index.html")
        )

        try runGit(["init", "--bare", remote.path], at: testContainer)
        try runGit(["init", "-b", "main"], at: testRoot)
        try runGit(["config", "user.name", "Background Importer Test"], at: testRoot)
        try runGit(["config", "user.email", "background-importer@example.invalid"], at: testRoot)
        try runGit(["add", "backgrounds/README.md", "index.html"], at: testRoot)
        try runGit(["commit", "-m", "Initial fixture"], at: testRoot)
        try runGit(["remote", "add", "origin", remote.path], at: testRoot)
        try runGit(["push", "-u", "origin", "main"], at: testRoot)

        setenv("BACKGROUND_REPOSITORY", testRoot.path, 1)
        try BackgroundRepository.prepareForAutomaticPublish()
        let added = try BackgroundRepository.add(BackgroundDetails(
            sourceFile: fixtureRoot.appendingPathComponent("backgrounds/app/AppIcon.png"),
            filename: "Importer Test",
            artist: "Example Artist",
            artistURL: "https://example.com/artist",
            sourceURL: "https://example.com/art"
        ))
        let revision = try BackgroundRepository.publish(added)
        let localShortRevision = try runGit(["rev-parse", "--short", "HEAD"], at: testRoot)
        let commitSubject = try runGit(["log", "-1", "--format=%s"], at: testRoot)
        let localRevision = try runGit(["rev-parse", "HEAD"], at: testRoot)
        let remoteRevision = try runGit(["rev-parse", "refs/heads/main"], at: remote)
        let repositoryStatus = try runGit(["status", "--porcelain"], at: testRoot)

        precondition(added == "importer-test.png")
        precondition(fileManager.fileExists(atPath: backgrounds.appendingPathComponent(added).path))
        precondition(revision == localShortRevision)
        precondition(commitSubject == "🖼️ Add importer-test background")
        precondition(localRevision == remoteRevision)
        precondition(repositoryStatus.isEmpty)

        let readme = try String(contentsOf: backgrounds.appendingPathComponent("README.md"), encoding: .utf8)
        precondition(readme.contains("- `importer-test` comes from [Example Artist](https://example.com/artist) ([src](https://example.com/art))"))

        let index = try String(contentsOf: testRoot.appendingPathComponent("index.html"), encoding: .utf8)
        let keysMarker = "{% assign background_keys = \""
        guard let keysStart = index.range(of: keysMarker),
              let keysEnd = index[keysStart.upperBound...].firstIndex(of: "\"") else {
            preconditionFailure("Background key registry was not found")
        }
        let keys = index[keysStart.upperBound..<keysEnd].split(separator: ",")
        precondition(keys.last == "importer-test")
        precondition(index.contains("\"importer-test\": {"))
        precondition(index.contains("\"artistUrl\": \"https://example.com/artist\""))
        precondition(index.contains("\"sourceUrl\": \"https://example.com/art\""))

        let unrelated = testRoot.appendingPathComponent("unrelated.txt")
        try "Leave this file alone.\n".write(to: unrelated, atomically: true, encoding: .utf8)
        try BackgroundRepository.prepareForAutomaticPublish()

        try runGit(["add", "unrelated.txt"], at: testRoot)
        var rejectedStagedChanges = false
        do {
            try BackgroundRepository.prepareForAutomaticPublish()
        } catch {
            rejectedStagedChanges = error.localizedDescription.contains("staged changes")
        }
        precondition(rejectedStagedChanges)

        try runGit(["reset", "--hard", "HEAD"], at: testRoot)
        try (index + "\n").write(to: testRoot.appendingPathComponent("index.html"), atomically: true, encoding: .utf8)
        var rejectedRegistryChanges = false
        do {
            try BackgroundRepository.prepareForAutomaticPublish()
        } catch {
            rejectedRegistryChanges = error.localizedDescription.contains("backgrounds/README.md and index.html")
        }
        precondition(rejectedRegistryChanges)

        print("Background importer integration test passed.")
    }

    @discardableResult
    private static func runGit(_ arguments: [String], at directory: URL) throws -> String {
        let process = Process()
        let output = Pipe()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = arguments
        process.currentDirectoryURL = directory
        process.standardOutput = output
        process.standardError = output
        try process.run()
        let data = output.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        let message = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard process.terminationStatus == 0 else {
            throw NSError(
                domain: "BackgroundImporterTests",
                code: Int(process.terminationStatus),
                userInfo: [NSLocalizedDescriptionKey: message]
            )
        }
        return message
    }
}
