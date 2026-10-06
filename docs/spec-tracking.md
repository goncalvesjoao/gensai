# Specification tracking

This file maps portable product documents to this repository's GitHub Issues.
It is repository administration, separate from the restart specification package.
Product documents use feature names and local links so they work without tracker
access.

| Portable spec                                                                   | GitHub issue                                                                                          | Tracker status on 2026-10-06 |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| [Map baseline](specs/map-baseline.md)                                           | [Existing Gensai map capabilities](https://github.com/goncalvesjoao/gensai/issues/8)                  | Completed                    |
| [Gensai map controls and persistent hazard menu](specs/map-controls.md)         | [Gensai map controls and persistent hazard menu](https://github.com/goncalvesjoao/gensai/issues/13)   | Open                         |
| [Selected location and device-location fallback](specs/location-selection.md)   | [Selected location and device-location fallback](https://github.com/goncalvesjoao/gensai/issues/9)    | Open                         |
| [Japanese and Latin-character address search](specs/address-search.md)          | [Japanese and Latin-character address search](https://github.com/goncalvesjoao/gensai/issues/10)      | Open                         |
| [Official hazard categories, legends and coverage](specs/hazard-exploration.md) | [Official hazard categories, legends and coverage](https://github.com/goncalvesjoao/gensai/issues/11) | Open                         |
| [Production access and first-release acceptance](specs/release-acceptance.md)   | [Production access and first-release acceptance](https://github.com/goncalvesjoao/gensai/issues/12)   | Open                         |

Issues remain the working tracker for this repository. The local documents are
portable versions of the same scope, exported on 2026-10-06 with named dependencies
instead of issue references. When scope changes, update the corresponding issue
and portable document. Keep delivery status here, separate from requirements;
completion here does not establish completion in a rebuild.

Mockup reconciliation on 2026-10-06 adds the map-controls spec and updates location,
address search, hazards and release acceptance. The historical baseline stays
completed; its sidebar requirements are superseded for the first release.

Home-page clarification on 2026-10-06 updates production access and map controls.
The Gensai entry point will show a welcome, a work-in-progress message and an
explicit map call to action. This supersedes the historical automatic redirect.
