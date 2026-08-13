import assert from "node:assert/strict";
import { findTaxonomyTerms, loadTaxonomySector, saudiCareerTaxonomy } from "@/modules/taxonomy";

assert.equal(saudiCareerTaxonomy.version, "0.1.0");
assert.equal(saudiCareerTaxonomy.officialClassification, false);
assert.ok(saudiCareerTaxonomy.disclaimer.includes("تصنيفاً حكومياً"));
assert.equal(loadTaxonomySector("technology")?.id, "technology");
assert.equal(findTaxonomyTerms("software")[0]?.id, "software-engineer");
assert.equal(findTaxonomyTerms("مطور")[0]?.id, "software-engineer");
assert.equal(findTaxonomyTerms("manager", "technology").length, 1);
assert.equal(findTaxonomyTerms("unknown-term").length, 0);
console.log("Phase 18 taxonomy smoke OK.");
