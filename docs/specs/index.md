# Product specs

Use these framework-independent documents to recreate the map baseline or build
the complete first release. Each includes user stories, product decisions,
acceptance criteria, exclusions and dependencies. No original code or project
tracker is needed.

| Spec                                                                      | Role                                                                                     | Dependencies                                       |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Map baseline](map-baseline.md)                                           | Basemap, URLs, language/theme preferences and responsive sidebar                         | None                                               |
| [Selected location and device-location fallback](location-selection.md)   | Explicit location acquisition, Japan validation, Tokyo fallback and selected-place state | Map baseline                                       |
| [Japanese and Latin-character address search](address-search.md)          | Working address search and result selection                                              | Selected location                                  |
| [Official hazard categories, legends and coverage](hazard-exploration.md) | Hazard exploration with correct colour, availability and failure interpretation          | Selected location; search is optional for delivery |
| [Production access and first-release acceptance](release-acceptance.md)   | Deployed access and integrated checks                                                    | All feature specs for final acceptance             |

Feature specs take precedence where they change the baseline. For a complete
release, implement explicit location permission, functioning search and official
hazards directly; intermediate automatic permission and placeholder search are
not prerequisites.

Read the [release scope](../first-release.md) for the audience, outcome and
exclusions. Each feature spec owns its open decisions and acceptance checks.
Domain terms are defined in the [glossary](../../GLOSSARY.md).

The [visual reference](../design/visual-reference.md) links a neutral editable
Canva UX playground. Historical screenshots and measurements document the old
appearance without constraining a new design. Feature specs govern new behavior.

To hand the specifications to another agent, copy this folder, `docs/design/`
(including its reference images), the release scope and the glossary together,
preserving relative paths. Track
completion in the destination project rather than assuming delivery status from
another implementation.
