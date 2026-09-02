#!/bin/zsh
set -euo pipefail

script_dir=${0:A:h}
repository_dir=${script_dir:h:h}
app_dir="$repository_dir/backgrounds/Background Importer.app"
contents_dir="$app_dir/Contents"

rm -rf "$app_dir"
mkdir -p "$contents_dir/MacOS" "$contents_dir/Resources"

swiftc \
  -parse-as-library \
  -O \
  -framework AppKit \
  -framework SwiftUI \
  -framework UniformTypeIdentifiers \
  "$script_dir/BackgroundImporter.swift" \
  -o "$contents_dir/MacOS/BackgroundImporter"

cp "$script_dir/Info.plist" "$contents_dir/Info.plist"
cp "$script_dir/AppIcon.png" "$contents_dir/Resources/AppIcon.png"

codesign --force --deep --sign - "$app_dir"
echo "Built $app_dir"
