require "fileutils"

# Publish aliases from Jekyll's actual output, not unrendered source files.
module PublishStatic
  def self.publish(site)
    root = File.expand_path(site.dest)
    prefix = File.expand_path("static", site.source) + "/"
    entries = site.static_files.map { |file| [file, file.path, file.extname] } +
      site.pages.map { |page| [page, page.relative_path, page.output_ext] }
    aliases = {}

    entries.each do |item, source, extension|
      source = File.expand_path(source, site.source)
      next unless source.start_with?(prefix) && item.write?

      relative = source.delete_prefix(prefix)
      relative = relative.delete_suffix(File.extname(relative)) + extension
      origin = File.expand_path(item.destination(site.dest))
      unless origin.start_with?(root + "/") && File.file?(origin) && !File.symlink?(origin)
        raise "Missing built static file: #{origin}"
      end

      # Keep the original static URL, including pages with explicit permalinks.
      [relative, File.join("static", relative)].each do |name|
        target = File.join(root, name)
        next if target == origin

        if aliases.key?(target) || File.exist?(target) || File.symlink?(target)
          raise "Static publishing collision: #{target}"
        end
        aliases[target] = origin
      end
    end

    # Validate the entire plan before writing anything.
    aliases.each_key do |target|
      parent = File.dirname(target)
      until parent == root
        if aliases.key?(parent) || File.symlink?(parent) ||
            (File.exist?(parent) && !File.directory?(parent))
          raise "Static publishing collision: #{parent}"
        end
        parent = File.dirname(parent)
      end
    end

    aliases.each do |target, origin|
      FileUtils.mkdir_p(File.dirname(target))
      FileUtils.copy_file(origin, target)
    end
    aliases.size
  end
end

if $PROGRAM_NAME == __FILE__
  # github-pages enforces safe mode, so explicitly register our build hook.
  require "jekyll"
  Jekyll::Hooks.register :site, :post_write do |site|
    Jekyll.logger.info "Static publishing:", "#{PublishStatic.publish(site)} aliases"
  end
  ARGV.unshift("build")
  load Gem.bin_path("jekyll", "jekyll")
end
