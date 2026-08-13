const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/`,
        `${baseUrl}/templates`,
        `${baseUrl}/features`,
        `${baseUrl}/privacy`,
        `${baseUrl}/assistant`,
        `${baseUrl}/jobs`,
        `${baseUrl}/cover-letters`,
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        // Performance remains a measured warning gate until the three-run Phase 14 baseline is reviewed.
        // Accessibility and Best Practices remain blocking release gates. Guest tools are intentionally noindex,
        // so SEO is measured as a warning across the mixed public/utility route suite.
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        interactive: ["warn", { maxNumericValue: 5000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "artifacts/lighthouse",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%",
    },
  },
};
