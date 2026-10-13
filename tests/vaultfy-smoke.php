<?php
declare(strict_types=1);
/**
 * Structural smoke tests for the Vaultfy presentation layer.
 * These do not simulate the Twsaa backend or payment flow.
 */
$root = dirname(__DIR__);
$files = [
    'views/layout/main.twig',
    'views/layout/header.twig',
    'views/home/index.twig',
    'views/products/list/card.twig',
    'views/products/view.twig',
    'views/checkout/cart/index.twig',
    'assets/css/vaultfy.css',
    'assets/js/vaultfy.js',
];
$failed = [];
$contents = [];
foreach ($files as $path) {
    $fullPath = $root . DIRECTORY_SEPARATOR . $path;
    if (!is_file($fullPath)) {
        $failed[] = "Missing file: $path";
        continue;
    }
    $contents[$path] = file_get_contents($fullPath);
}
if (!$failed) {
    $layout = $contents['views/layout/main.twig'];
    $home = $contents['views/home/index.twig'];
    $header = $contents['views/layout/header.twig'];
    $style = $contents['assets/css/vaultfy.css'];
    $script = $contents['assets/js/vaultfy.js'];
    $assert = static function(bool $ok, string $reason) use (&$failed): void {
        if (!$ok) $failed[] = $reason;
    };
    $assert(str_contains($layout, "css/vaultfy.css"), "Missing brand CSS link");
    $assert(str_contains($layout, "js/vaultfy.js"), "Missing JS asset link");
    $assert(str_contains($layout, "lang == 'ar' ? 'rtl' : 'ltr'"), "Document RTL language missing");
    $assert(str_contains($layout, "include(\"layout/header.twig\")"), "Twsaa header inclusion missing");
    $assert(str_contains($layout, "include(\"layout/footer.twig\")"), "Twsaa footer inclusion missing");
    $assert(str_contains($home, "for content in homeContent"), "Native homeContent rendering removed");
    $assert(str_contains($home, "data-id=\"{{ content['block_id'] }}\""), "Native products block attributes removed");
    $assert(str_contains($home, "vf-category-grid"), "Category grid missing");
    $assert(str_contains($script, "querySelector('#cat-here')"), "Native category feed not used");
    $assert(str_contains($header, "getFunction('getCurrentChannel')"), "Merchant channel data missing");
    $assert(str_contains($style, "--vf-bg:"), "Dark color tokens missing");
    foreach (['views/layout/main.twig', 'views/home/index.twig'] as $path) {
        $open = preg_match_all('/\\{%\\s*block\\s+/', $contents[$path]);
        $close = preg_match_all('/\\{%\\s*endblock\\s*%\\}/', $contents[$path]);
        $assert($open === $close, "Twig block tags unbalanced: $path");
    }
}
if ($failed) {
    fwrite(STDERR, "Vaultfy smoke checks FAILED:\n - " . implode("\n - ", $failed) . "\n");
    exit(1);
}
echo "Vaultfy smoke checks passed. Live Twsaa preview is still required.\n";
