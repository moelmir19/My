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
    'views/category/index.twig',
    'views/custom/vaultfy-posters.twig',
    'views/custom/bold-banner.twig',
    'views/products/list/card.twig',
    'views/products/view.twig',
    'views/checkout/cart/index.twig',
    'assets/css/vaultfy.css',
    'assets/css/vf-pages.css',
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
    $assert(str_contains($layout, "css/vf-pages.css"), "Missing page styles link");
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
    $assert(str_contains($header, 'vf-mobile-search') && str_contains($header, 'vf-menu-toggle'), "Mobile utility buttons missing");
    $assert(str_contains($header, 'vf-primary-menu') && str_contains($header, 'vf-search-panel'), "Desktop header regions missing");
    $assert(str_contains($home, 'vf_poster_blocks') && str_contains($home, 'custom/vaultfy-posters.twig'), "Merchant-managed poster block not rendered");
    $assert(str_contains($contents['views/category/index.twig'], 'data-vf-image'), "Native category thumbnails unavailable");
    $assert(str_contains($contents['views/custom/vaultfy-posters.twig'], "content['settings']['items']"), "Poster images not loaded from Twsaa");
    $assert(str_contains($contents['views/custom/bold-banner.twig'], "content['settings']['image']"), "Native merchant banner image missing");
    $assert(str_contains($script, 'MutationObserver') && str_contains($script, 'createPoster'), "Category gallery initialization missing");
    $assert(str_contains($style, 'grid-template-columns:repeat(3,minmax(0,1fr))'), "Three-up poster grid missing");
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
