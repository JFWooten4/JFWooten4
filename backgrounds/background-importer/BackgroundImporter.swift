import AppKit
import SwiftUI
import UniformTypeIdentifiers

struct BackgroundDetails {
    let sourceFile: URL
    let filename: String
    let artist: String
    let artistURL: String
    let sourceURL: String
}

private enum ImportError: LocalizedError {
    case invalidImage
    case invalidFilename
    case invalidArtist
    case invalidURL(String)
    case duplicate(String)
    case repositoryNotFound
    case unexpectedFormat(String)

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Drop a PNG, JPG, JPEG, or WebP image."
        case .invalidFilename:
            return "Enter a filename containing at least one letter or number."
        case .invalidArtist:
            return "Enter the artist or organization to credit."
        case .invalidURL(let field):
            return "Enter a valid http or https URL for \(field)."
        case .duplicate(let name):
            return "A background named \(name) is already registered."
        case .repositoryNotFound:
            return "The app could not find backgrounds/README.md and index.html. Keep the app in the backgrounds folder."
        case .unexpectedFormat(let file):
            return "The expected background registry was not found in \(file)."
        }
    }
}

enum BackgroundRepository {
    private static let supportedExtensions = Set(["png", "jpg", "jpeg", "webp"])

    static func normalizedKey(_ value: String) -> String {
        value.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
            .joined(separator: "-")
    }

    static func validateImage(_ url: URL) -> Bool {
        supportedExtensions.contains(url.pathExtension.lowercased()) && NSImage(contentsOf: url) != nil
    }

    static func add(_ details: BackgroundDetails) throws -> String {
        guard validateImage(details.sourceFile) else { throw ImportError.invalidImage }

        let key = normalizedKey(details.filename)
        guard !key.isEmpty else { throw ImportError.invalidFilename }

        let artist = details.artist.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !artist.isEmpty else { throw ImportError.invalidArtist }

        let artistURL = details.artistURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let sourceURL = details.sourceURL.trimmingCharacters(in: .whitespacesAndNewlines)
        if !artistURL.isEmpty && validatedWebURL(artistURL) == nil { throw ImportError.invalidURL("Artist URL") }
        guard validatedWebURL(sourceURL) != nil else { throw ImportError.invalidURL("art source") }

        let backgrounds = try locateBackgroundsDirectory()
        let repository = backgrounds.deletingLastPathComponent()
        let readmeURL = backgrounds.appendingPathComponent("README.md")
        let indexURL = repository.appendingPathComponent("index.html")
        let fileManager = FileManager.default

        guard fileManager.fileExists(atPath: readmeURL.path), fileManager.fileExists(atPath: indexURL.path) else {
            throw ImportError.repositoryNotFound
        }

        let sourceExtension = details.sourceFile.pathExtension.lowercased()
        let imageExtension = sourceExtension == "jpeg" ? "jpg" : sourceExtension
        let destination = backgrounds.appendingPathComponent("\(key).\(imageExtension)")
        guard !fileManager.fileExists(atPath: destination.path) else { throw ImportError.duplicate(destination.lastPathComponent) }

        let originalReadme = try String(contentsOf: readmeURL, encoding: .utf8)
        let originalIndex = try String(contentsOf: indexURL, encoding: .utf8)
        guard !registeredKeys(in: originalIndex).contains(key) else { throw ImportError.duplicate(key) }

        let updatedReadme = try addCredit(
            key: key,
            artist: artist,
            artistURL: artistURL,
            sourceURL: sourceURL,
            to: originalReadme
        )
        let updatedIndex = try addToIndex(
            key: key,
            artist: artist,
            artistURL: artistURL,
            sourceURL: sourceURL,
            in: originalIndex
        )

        let accessed = details.sourceFile.startAccessingSecurityScopedResource()
        defer {
            if accessed { details.sourceFile.stopAccessingSecurityScopedResource() }
        }

        do {
            try fileManager.copyItem(at: details.sourceFile, to: destination)
            try updatedReadme.write(to: readmeURL, atomically: true, encoding: .utf8)
            try updatedIndex.write(to: indexURL, atomically: true, encoding: .utf8)
        } catch {
            try? originalReadme.write(to: readmeURL, atomically: true, encoding: .utf8)
            try? originalIndex.write(to: indexURL, atomically: true, encoding: .utf8)
            try? fileManager.removeItem(at: destination)
            throw error
        }

        return destination.lastPathComponent
    }

    private static func locateBackgroundsDirectory() throws -> URL {
        if let override = ProcessInfo.processInfo.environment["BACKGROUND_REPOSITORY"] {
            let root = URL(fileURLWithPath: override, isDirectory: true)
            let candidate = root.appendingPathComponent("backgrounds", isDirectory: true)
            if FileManager.default.fileExists(atPath: candidate.appendingPathComponent("README.md").path) {
                return candidate
            }
        }

        let bundle = Bundle.main.bundleURL
        if bundle.pathExtension == "app" {
            let candidate = bundle.deletingLastPathComponent()
            if FileManager.default.fileExists(atPath: candidate.appendingPathComponent("README.md").path) {
                return candidate
            }
        }

        var candidate = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
        for _ in 0..<4 {
            let backgrounds = candidate.lastPathComponent == "backgrounds"
                ? candidate
                : candidate.appendingPathComponent("backgrounds", isDirectory: true)
            if FileManager.default.fileExists(atPath: backgrounds.appendingPathComponent("README.md").path) {
                return backgrounds
            }
            candidate.deleteLastPathComponent()
        }

        throw ImportError.repositoryNotFound
    }

    private static func registeredKeys(in index: String) -> Set<String> {
        guard let assignment = index.range(of: "{% assign background_keys = \""),
              let end = index[assignment.upperBound...].firstIndex(of: "\"") else { return [] }
        return Set(index[assignment.upperBound..<end].split(separator: ",").map(String.init))
    }

    private static func addCredit(
        key: String,
        artist: String,
        artistURL: String,
        sourceURL: String,
        to readme: String
    ) throws -> String {
        let safeArtist = markdownLabel(artist)
        let artistCredit = artistURL.isEmpty ? safeArtist : "[\(safeArtist)](\(artistURL))"
        let line = "- `\(key)` comes from \(artistCredit) ([src](\(sourceURL)))\n"

        if let footnote = readme.range(of: "\n[^", options: .backwards) {
            return readme.replacingCharacters(in: footnote.lowerBound..<footnote.lowerBound, with: line)
        }
        return readme.trimmingCharacters(in: .newlines) + "\n" + line
    }

    private static func addToIndex(
        key: String,
        artist: String,
        artistURL: String,
        sourceURL: String,
        in index: String
    ) throws -> String {
        guard let assignment = index.range(of: "{% assign background_keys = \""),
              let keysEnd = index[assignment.upperBound...].firstIndex(of: "\"") else {
            throw ImportError.unexpectedFormat("index.html")
        }

        var updated = index
        updated.insert(contentsOf: ",\(key)", at: keysEnd)

        guard let creditsStart = updated.range(of: "    window.homepageBackgroundCredits = {\n"),
              let bannerStart = updated.range(of: "    window.homepageBannerImages = [", range: creditsStart.upperBound..<updated.endIndex),
              let creditsEnd = updated.range(of: "\n    };", options: .backwards, range: creditsStart.upperBound..<bannerStart.lowerBound) else {
            throw ImportError.unexpectedFormat("index.html")
        }

        let credit = jsonCredit(key: key, artist: artist, artistURL: artistURL, sourceURL: sourceURL)
        let block = updated[creditsStart.upperBound..<creditsEnd.lowerBound]
        let keyPattern = try NSRegularExpression(pattern: #"(?m)^      \"([^\"]+)\": \{$"#)
        let blockString = String(block)
        let matches = keyPattern.matches(in: blockString, range: NSRange(blockString.startIndex..., in: blockString))

        for match in matches {
            guard let nameRange = Range(match.range(at: 1), in: blockString),
                  let lineRange = Range(match.range(at: 0), in: blockString) else { continue }
            if String(blockString[nameRange]).localizedStandardCompare(key) == .orderedDescending {
                let offset = blockString.distance(from: blockString.startIndex, to: lineRange.lowerBound)
                let insertion = updated.index(creditsStart.upperBound, offsetBy: offset)
                updated.insert(contentsOf: credit + ",\n", at: insertion)
                return updated
            }
        }

        guard let lastClose = updated.range(of: "\n      }", options: .backwards, range: creditsStart.upperBound..<creditsEnd.lowerBound) else {
            throw ImportError.unexpectedFormat("index.html")
        }
        updated.insert(",", at: lastClose.upperBound)
        let refreshedBannerStart = updated.range(of: "    window.homepageBannerImages = [", range: creditsStart.upperBound..<updated.endIndex)!
        let refreshedEnd = updated.range(of: "\n    };", options: .backwards, range: creditsStart.upperBound..<refreshedBannerStart.lowerBound)!
        updated.insert(contentsOf: "\n" + credit, at: refreshedEnd.lowerBound)
        return updated
    }

    private static func jsonCredit(key: String, artist: String, artistURL: String, sourceURL: String) -> String {
        var lines = [
            "      \(jsonString(key)): {",
            "        \"artist\": \(jsonString(artist)),"
        ]
        if !artistURL.isEmpty {
            lines.append("        \"artistUrl\": \(jsonString(artistURL)),")
        }
        lines.append("        \"sourceUrl\": \(jsonString(sourceURL))")
        lines.append("      }")
        return lines.joined(separator: "\n")
    }

    private static func jsonString(_ value: String) -> String {
        let data = try! JSONSerialization.data(withJSONObject: [value])
        let array = String(data: data, encoding: .utf8)!
        return String(array.dropFirst().dropLast()).replacingOccurrences(of: "\\/", with: "/")
    }

    private static func markdownLabel(_ value: String) -> String {
        value.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "[", with: "\\[")
            .replacingOccurrences(of: "]", with: "\\]")
    }

    private static func validatedWebURL(_ value: String) -> URL? {
        guard let url = URL(string: value), let scheme = url.scheme?.lowercased(),
              scheme == "http" || scheme == "https", url.host != nil else { return nil }
        return url
    }
}

private struct ContentView: View {
    @State private var selectedFile: URL?
    @State private var filename = ""
    @State private var artist = ""
    @State private var artistURL = ""
    @State private var sourceURL = ""
    @State private var isTargeted = false
    @State private var isChoosingFile = false
    @State private var status = "Drop an image to begin."
    @State private var statusIsError = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 12) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.system(size: 34))
                    .foregroundStyle(.purple)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Background Importer").font(.title2.bold())
                    Text("Add an image and its credits everywhere the homepage expects them.")
                        .foregroundStyle(.secondary)
                }
            }

            dropZone

            Form {
                TextField("Filename", text: $filename, prompt: Text("honing-in"))
                TextField("Artist or organization", text: $artist, prompt: Text("Riot Games"))
                TextField("Artist URL (optional)", text: $artistURL, prompt: Text("https://…"))
                TextField("Artwork source URL", text: $sourceURL, prompt: Text("https://…"))
            }
            .formStyle(.grouped)

            HStack {
                Text(status)
                    .font(.callout)
                    .foregroundStyle(statusIsError ? Color.red : Color.secondary)
                    .lineLimit(2)
                Spacer()
                Button("Add Background", action: addBackground)
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedFile == nil)
                    .keyboardShortcut(.defaultAction)
            }
        }
        .padding(24)
        .frame(width: 620)
        .fileImporter(isPresented: $isChoosingFile, allowedContentTypes: [.image]) { result in
            if case .success(let url) = result { select(url) }
        }
    }

    private var dropZone: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14)
                .fill(isTargeted ? Color.accentColor.opacity(0.16) : Color.secondary.opacity(0.08))
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(isTargeted ? Color.accentColor : Color.secondary.opacity(0.35), style: StrokeStyle(lineWidth: 2, dash: [7]))
            HStack(spacing: 16) {
                if let selectedFile, let image = NSImage(contentsOf: selectedFile) {
                    Image(nsImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 90)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    Image(systemName: "photo.badge.plus")
                        .font(.system(size: 42))
                        .foregroundStyle(.secondary)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text(selectedFile?.lastPathComponent ?? "Drop a background image here")
                        .font(.headline)
                    Button("Choose Image…") { isChoosingFile = true }
                }
            }
            .padding()
        }
        .frame(height: 130)
        .dropDestination(for: URL.self) { urls, _ in
            guard let url = urls.first else { return false }
            select(url)
            return true
        } isTargeted: { isTargeted = $0 }
    }

    private func select(_ url: URL) {
        guard BackgroundRepository.validateImage(url) else {
            status = ImportError.invalidImage.localizedDescription
            statusIsError = true
            return
        }
        selectedFile = url
        if filename.isEmpty {
            filename = BackgroundRepository.normalizedKey(url.deletingPathExtension().lastPathComponent)
        }
        status = "Ready to add \(url.lastPathComponent)."
        statusIsError = false
    }

    private func addBackground() {
        guard let selectedFile else { return }
        do {
            let added = try BackgroundRepository.add(BackgroundDetails(
                sourceFile: selectedFile,
                filename: filename,
                artist: artist,
                artistURL: artistURL,
                sourceURL: sourceURL
            ))
            status = "Added \(added), its README credit, and homepage registration."
            statusIsError = false
        } catch {
            status = error.localizedDescription
            statusIsError = true
        }
    }
}

#if !IMPORTER_TESTING
@main
private struct BackgroundImporterApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowResizability(.contentSize)
    }
}
#endif
