<?php
/**
 * Compile every Twig template without relying on the local demo's page routes.
 * This catches syntax and unknown Twig-function/filter errors before upload.
 */
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Twig\CustomTwigExtensions;
use App\Twig\Translator;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

$views = dirname(__DIR__) . '/views';
$loader = new FilesystemLoader($views);
$twig = new Environment($loader, [
    'cache' => false,
    'strict_variables' => false,
]);
$twig->addExtension(new Twig\Extension\DebugExtension());
$twig->addExtension(new CustomTwigExtensions(new Translator()));
// Upstream templates also call the platform/Laravel asset() helper, even though
// the local preview's extension does not register it. Syntax-only CI shim.
$twig->addFunction(new Twig\\TwigFunction('asset', static fn (string $path): string => $path));

$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($views, FilesystemIterator::SKIP_DOTS)
);

$count = 0;
$legacy = [];
$errors = [];
$upstreamViews = (getenv('TWSAA_UPSTREAM') ?: '/tmp/twsaa-upstream') . '/views';

foreach ($files as $file) {
    if (!$file->isFile() || strtolower($file->getExtension()) !== 'twig') {
        continue;
    }

    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($views) + 1));

    try {
        $source = $loader->getSourceContext($relative);
        $twig->parse($twig->tokenize($source));
        ++$count;
    } catch (Throwable $exception) {
        /*
         * The sample theme itself contains a Blade-style country-state.twig,
         * which is not Twig syntax. Never misreport an identical upstream file
         * as a SubCove regression. Any changed file still fails immediately.
         */
        $upstreamFile = $upstreamViews . '/' . $relative;
        if (is_file($upstreamFile) &&
            hash_file('sha256', $upstreamFile) === hash_file('sha256', $file->getPathname())) {
            $legacy[] = $relative . ' (unchanged upstream, not valid standalone Twig)';
        } else {
            $errors[] = $relative . ': ' . $exception->getMessage();
        }
    }
}

echo "Twig templates parsed: {$count}\n";

if ($errors) {
    fwrite(STDERR, implode("\n", $errors) . "\n");
    exit(1);
}

echo "All Twig syntax checks passed.\n";
