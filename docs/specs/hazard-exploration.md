# Official hazard categories, legends and coverage

## Problem statement

Current residents need to interpret official mapped hazards around a selected location without confusing absent colour, unavailable data or a request failure with safety.

## Solution

Provide three independently switchable official hazard categories on a muted basemap, synchronized readable legends and attribution, verified coverage information and separate loading/failure explanations. Keep hazard display and its safety interpretation in one spec.

## User stories

1. As a current resident, I want tsunami inundation depth selected initially, so that the first hazard category has a predictable meaning.
2. As a current resident, I want to switch to maximum-scale river inundation depth, so that I can inspect the mapped river-flood scenario.
3. As a current resident, I want the river category to combine national and prefectural data, so that I can inspect the available official mapping.
4. As a current resident, I want to inspect debris flow, steep-slope collapse and landslide warning zones together, so that I can examine the landslide category.
5. As a current resident, I want to turn each hazard category on or off independently, so that I can inspect one category or compare enabled categories together.
6. As a current resident, I want my enabled categories preserved when changing the selected location, so that I can compare places under the same hazards.
7. As a current resident, I want a readable legend for each enabled category, so that I can interpret its mapped colours.
8. As a current resident, I want separate legend entries for the three landslide types, so that I can distinguish them.
9. As a current resident, I want a muted basemap beneath official hazard colours, so that I can see the hazard mapping clearly.
10. As a current resident, I want the warning "No colour does not mean safe. Data may be missing" beside the legend, so that absent colour does not imply safety.
11. As a current resident, I want coverage information only where it can be verified, so that the map does not invent missing-data boundaries.
12. As a current resident, I want unavailable coverage distinguished visually only where its boundaries are verified, so that hatching does not make unsupported claims.
13. As a current resident, I want map and hazard loading failures explained separately from coverage, so that failed requests are not mistaken for no mapped hazard.
14. As a current resident, I want official data attribution, so that I can identify the source of the mapping.
15. As an English- or Japanese-speaking current resident, I want hazard controls, legends and coverage explanations in my chosen language, so that I can interpret the map.
16. As a keyboard user, I want accessible category controls, so that I can choose the hazard category without a pointer.
17. As a current resident on a phone, I want readable legends and enough map visible, so that I can inspect the surrounding mapped hazards.
18. As a current resident, I want Tsunami, Flooding and Landslide switches in the hazard menu, so that I can control the mapped categories.
19. As a current resident, I want changing a hazard switch to leave the menu open, so that I can make several adjustments.
20. As a current resident, I want closing the menu to leave enabled hazard layers visible, so that I can inspect more of the map.
21. As a current resident, I want to turn all categories off, so that I can view the basemap alone.
22. As a current resident, I want failed or loading hazard data distinguished from a switch being off, so that I do not mistake absent rendering for my chosen setting.
23. As a current resident, I want labels for overlapping categories and their legends, so that I can understand which hazard data I enabled.

## Product decisions

This is a framework-independent product spec. No existing code, library, rendering architecture or testing tool is required.

- Provide river flooding using assumed maximum-scale inundation depth, combining national and prefectural river data; tsunami inundation depth; and landslide hazards showing debris flow, steep-slope collapse and landslide warning zones together.
- Provide independent on/off switches labeled Tsunami, Flooding and Landslide in English, with Japanese equivalents. Flooding remains the previously specified maximum-scale river inundation category, not all flood types. Keep tsunami enabled initially and the other categories off. The mockup shows repeated switch icons but does not specify startup values.
- Permit any combination of enabled categories, including none. Changing one switch does not turn another off. This supersedes the earlier one-category-at-a-time requirement, interpreting the separate on/off switches in the mockup as independent visibility controls. Preserve enabled categories through device, map-point or address selection and through menu closing/reopening.
- Keep the hazard menu open after switch activation. Its initial state, explicit dismissal and accessibility behavior belong to the [map-controls spec](map-controls.md).
- Use a muted basemap beneath official hazard colours. Keep enabled-category data and legends consistent. Turning a category off removes its display; stale requests cannot re-enable it. Do not relabel obsolete data as a newly enabled category. Render separate hazard layers with a documented deterministic order; do not calculate or invent combined hazard colors or scores. Explain overlapping enabled layers where needed for interpretation.
- Show a readable legend for each enabled category with separate entries for all three landslide types. Keep legends, the no-colour warning and required official attribution accessible while the menu is closed. When no category is enabled, make that state clear; it is not a safety verdict.
- Keep "No colour does not mean safe. Data may be missing" prominent beside the legend in both launch languages. Provide no property verdict, calculated hazard score or textual point summary.
- Show verified coverage information where available. Shade or hatch unavailable coverage only when its geographic boundaries can be verified. Uncoloured pixels alone establish neither safety nor unavailable coverage.
- Distinguish map and hazard loading/failure states, including partial layer failures, from verified coverage. Completing device acquisition or search must not imply map or hazard readiness. Keep available parts usable after a failure.
- Use the selected location, marker and readable place label supplied by [selected-location spec](location-selection.md). Category changes must not discard that selection, and location/layout changes must not discard enabled categories or readable legends.
- Localize category controls, legends, map-control labels and explanations in English and Japanese. Support keyboard interaction, visible focus and readable application themes. A separate dark basemap is not required.
- On phones and computers keep enough map visible to inspect surroundings. Open panels must not have map controls/scales displayed over their content.
- Choose the muted basemap and verify official source datasets, supported scales, legends, attribution, reuse conditions and publication coverage during implementation. Decide national/prefectural river overlap priority, landslide composition and cross-category drawing order from evidence. Record that order and check that source colors and per-category legends remain interpretable with multiple categories enabled. No map-rendering library, basemap vendor or tile-request mechanism is prescribed.

## Acceptance criteria

Use the complete visible feature and its public behavior as the acceptance boundary. Any suitable tools may be used; controlled device/provider responses allow repeatable checks without prescribing internal interfaces.

1. Tsunami alone is initially enabled. Each switch changes only its own category. Exercise all eight combinations of the three switches, including all off and all on. Visible layers and legends match the enabled set without stale responses re-enabling a disabled category. Switch changes keep the menu open; closing and reopening preserves choices and map display.
2. Verify maximum-scale river data includes both official source types and that composition follows its recorded overlap decision. Verify all three landslide types and legend entries.
3. Changing selected location through [selected-location spec](location-selection.md) or address search preserves the enabled categories. Category switching and layout changes preserve the selected place and marker.
4. Official colours and per-category legends agree with source meaning, and attribution is readable with the menu open or closed. Multiple enabled layers follow the recorded drawing order without invented combined colors. The basemap does not compete visually with hazard colours. All-off display explicitly identifies that no categories are enabled.
5. Both languages prominently show the complete no-colour warning. No interface or acceptance check infers safety or coverage from absence of colour.
6. Unknown coverage, verified unavailable coverage, failed requests and partial failures are distinguishable. Shading is present only where verified boundaries support it.
7. Map/hazard pending and failed states remain independent from location/search completion. Available functions remain usable after failures.
8. Exercise keyboard category selection and readable legends on phone/computer layouts in both languages/themes, including hazard-menu layering, scale and map controls. Each switch has a localized accessible name and checked state.
9. Verify real official datasets, legend meaning, attribution, reuse terms, composition and coverage evidence separately from controlled-response checks.

## Out of scope

Location acquisition and search, production hosting, automatic safety judgments, property verdicts and textual point summaries. Deferred layers include inland flooding, storm surge, flood duration, flood-flow building-collapse zones, riverbank erosion, design-scale river flooding, avalanche danger, earthquake shaking and liquefaction.

## Dependencies and open decisions

Role: first-release feature requirements. Evaluate completion against this spec in the implementation being built.

The mockups depict independent switches. This spec adopts that interpretation and supersedes the earlier exclusive-category rule. The ellipsis does not add unnamed hazards or change the three-category release scope. The mockup does not define cross-category drawing order; verify and record it during implementation.

The [map-controls spec](map-controls.md) owns menu visibility and dismissal. This feature depends on [selected-location behavior](location-selection.md).
[Address search](address-search.md) is optional for hazard delivery because device
and map-point selection also supply a place. [Release acceptance](release-acceptance.md)
verifies the integrated workflow.

Verify official source and coverage evidence before release. Consult the
[Hazard Map Portal catalogue](https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html)
for integration research and check current details before using a dataset.

For coverage interpretation, consult [GSI's FAQ, questions 23 and 24](https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/faq/faq.html).
Absent hazard display can reflect missing data, publication can lag source updates,
and zooming in does not establish greater accuracy. Verify current source guidance
before release.
