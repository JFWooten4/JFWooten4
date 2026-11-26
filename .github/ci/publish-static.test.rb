require "minitest/autorun"
require "tmpdir"
require_relative "../../api/_publish-static"

class PublishStaticTest < Minitest::Test
  Static = Struct.new(:path, :extname, :output, :published) do
    def destination(_dest); output; end
    def write?; published != false; end
  end
  Page = Struct.new(:relative_path, :output_ext, :output) do
    def destination(_dest); output; end
    def write?; true; end
  end
  Site = Struct.new(:source, :dest, :static_files, :pages)

  def setup
    @source = Dir.mktmpdir
    @dest = File.join(@source, "_site")
    FileUtils.mkdir_p(@dest)
    @site = Site.new(@source, @dest, [], [])
  end

  def teardown
    FileUtils.remove_entry(@source)
  end

  def output(relative, contents)
    file = File.join(@dest, relative)
    FileUtils.mkdir_p(File.dirname(file))
    File.binwrite(file, contents)
    file
  end

  def static(relative, contents)
    file = output(relative, contents)
    @site.static_files << Static.new(File.join(@source, relative), File.extname(relative), file, true)
  end

  def test_nested_binary_files_and_rendered_permalinks
    bytes = "%PDF-\x00\xff".b
    static("static/new/nested/file.pdf", bytes)
    static("static/tax/index.html", "<html>tax</html>")
    static("assets/other.css", "body {}")
    @site.pages << Page.new("static/ppt/index.html", ".html", output("slides/index.html", "<html>rendered</html>"))
    @site.pages << Page.new("static/guide.md", ".html", output("guide/index.html", "<html>guide</html>"))
    @site.static_files << Static.new(File.join(@source, "static/private.pdf"), ".pdf", nil, false)

    assert_equal 6, PublishStatic.publish(@site)
    assert_equal bytes, File.binread(File.join(@dest, "new/nested/file.pdf"))
    assert_equal bytes, File.binread(File.join(@dest, "static/new/nested/file.pdf"))
    assert_equal "<html>tax</html>", File.read(File.join(@dest, "tax/index.html"))
    %w[ppt/index.html static/ppt/index.html slides/index.html].each do |file|
      assert_equal "<html>rendered</html>", File.read(File.join(@dest, file))
    end
    assert_equal "<html>guide</html>", File.read(File.join(@dest, "guide.html"))
    assert_equal "<html>guide</html>", File.read(File.join(@dest, "static/guide.html"))
    refute File.exist?(File.join(@dest, "private.pdf"))
    refute File.exist?(File.join(@dest, "static/assets/other.css"))
  end

  def test_existing_output_collision_does_not_overwrite_or_partially_copy
    static("static/new.pdf", "new")
    static("static/index.html", "static")
    output("index.html", "homepage")
    assert_raises(RuntimeError) { PublishStatic.publish(@site) }
    assert_equal "homepage", File.read(File.join(@dest, "index.html"))
    refute File.exist?(File.join(@dest, "new.pdf"))
  end

  def test_planned_parent_collision
    static("static/example", "file")
    @site.pages << Page.new("static/example/nested.html", ".html", output("permalink/index.html", "page"))
    assert_raises(RuntimeError) { PublishStatic.publish(@site) }
    refute File.exist?(File.join(@dest, "example"))
  end
end
