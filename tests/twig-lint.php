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

$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($views, FilesystemIterator::SKIP_DOTS)
);

$count = 0;
$errors = [];

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
        $errors[] = $relative . ': ' . $exception->getMessage();
    }
}

echo "Twig templates parsed: {$count}\n";

if ($errors) {
    fwrite(STDERR, implode("\n", $errors) . "\n");
    exit(1);
}

echo "All Twig syntax checks passed.\n";
