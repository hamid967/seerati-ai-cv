# Phase 17 Theme Performance Report

## Budgets

| Metric                      |       Budget | Enforcement                                     |
| --------------------------- | -----------: | ----------------------------------------------- |
| Intro compressed JavaScript |       ≤35 KB | Blocking after production measurement           |
| Intro assets                |      ≤150 KB | Blocking before rollout                         |
| Initial JavaScript growth   |       ≤35 KB | Compare against Phase 17 baseline               |
| LCP regression              |      ≤100 ms | Blocking after three-run comparison             |
| CLS                         |         ≤0.1 | Blocking                                        |
| Homepage Performance        |          ≥90 | Initially warning, then owner-reviewed blocking |
| Templates Performance       | ≥85, then 90 | Staged                                          |
| Assistant Performance       |          ≥85 | Staged                                          |
| Accessibility               |          ≥95 | Blocking after stable baseline                  |
| Best Practices              |          ≥95 | Blocking                                        |
| Public SEO                  |          ≥95 | Staged; noindex tools remain exempt             |

## Current implementation impact

The semantic theme is CSS-only and adds no runtime dependency. The homepage city story uses text and CSS gradients rather than image or WebGL assets. The hero continues to use the existing preloaded resume image. A production preview and three-run Lighthouse comparison remain required before claiming that the new slice meets the budgets.

## Failure response

If a visual slice increases LCP, CLS, long tasks, or scroll jank, remove the heavy effect, use CSS/SVG or a static asset, shorten the intro, stop autoplay, or move the feature below the critical path. Do not lower the budget or update a visual/performance baseline merely to make CI green.
