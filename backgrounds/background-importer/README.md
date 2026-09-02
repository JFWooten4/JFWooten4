# Background Importer

A small native macOS utility for adding a background image to the site without manually updating each registry.

## Build and use

1. Run `./build-app.sh` from this directory.
2. Open `../Background Importer.app`.
3. Drop in a PNG, JPG, JPEG, or WebP image.
4. Enter its filename, artist or organization, optional artist URL, and artwork source URL.
5. Select **Add Background**.

The app copies the image into `backgrounds/`, adds its credit to `backgrounds/README.md`, and registers both the image and its credit in `index.html`. It refuses duplicate names and restores the original files if an update fails.

The build script replaces the tracked app at `backgrounds/Background Importer.app`. Keep the app directly in `backgrounds/` so it can locate the repository.

Run `./test.sh` to compile the importer and validate its full write path against a temporary repository copy.
