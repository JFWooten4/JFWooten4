#!/bin/zsh
set -euo pipefail

script_dir=${0:A:h}
test_binary=$(mktemp "${TMPDIR:-/tmp}/background-importer-tests.XXXXXX")
trap 'rm -f "$test_binary"' EXIT

swiftc \
  -D IMPORTER_TESTING \
  -parse-as-library \
  -framework AppKit \
  -framework SwiftUI \
  -framework UniformTypeIdentifiers \
  "$script_dir/BackgroundImporter.swift" \
  "$script_dir/ImporterTests.swift" \
  -o "$test_binary"

cd "$script_dir/../.."
"$test_binary"
