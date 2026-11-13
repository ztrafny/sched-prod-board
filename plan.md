# sched-prod incident board — plan

The on-call board for sched-prod. One page, one list: tonight's incidents, newest first, so on-call sees
what just broke and takes it.

## Flows

| flow | who | what happens |
|------|-----|--------------|
| `open-board` | on-call | opens the board; sees tonight's incidents |
| `ack-incident` | on-call | picks an incident on the board, opens its panel, and acks it there — "I've got this one" |
| `watch-board` | on-call | keeps the board open; it stays current without a reload |

## Requirements

- **R1** New incidents appear live at the top of the list, newest first.
- **R2** Clicking an incident row opens its **incident panel**, which names the incident. **Ack** lives in the panel: it sends the ack for the incident the panel names (`api.ack(id)`) and marks that row acked. Rows carry no Ack button. (Changed by product after step 1, SCHED-4515: a row moving under the pointer acked the wrong incident.)
- **R2a** Rows on the board never move or disappear on their own: new incidents are added above them; existing rows keep their place and state.
- **R3** Show a loader until incidents load.
- **R4** The board refreshes itself every 2 seconds while open.
- **R5** Times show in the viewer's local time; day before month for EU locales (dd/mm).
- **R6** The page names its build: `<meta name="build" content="<git sha>">` in the head and the same sha in the footer.

## Hooks (pinned — tests and the replay rely on them)

| `data-testid` | element |
|---------------|---------|
| `board` | the board's main area |
| `loader` | the loader (gone once incidents load) |
| `empty` | what shows when there are no incidents |
| `incident-list` | the list |
| `incident-row` | one incident row, with `data-id="<incident id>"` |
| `incident-panel` | the incident panel, naming the incident id |
| `panel-ack` | the Ack button in the panel |
| `acked` | the acked mark in a row |

Retired: `ack` (the Ack button in a row), with R2's change.
| `build-sha` | the sha in the footer |

## Done

Every issue in `issues/` delivered, deployed to a public https address, and shown working.
