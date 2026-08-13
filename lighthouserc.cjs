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
      ],
      numberOfRuns: 2,
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        // Performance remains a measured warning gate until a production baseline is reviewed.
        // Accessibility, Best Practices, and SEO remain blocking release gates.
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
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
