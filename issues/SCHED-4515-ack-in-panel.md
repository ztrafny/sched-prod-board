---
id: SCHED-4515
title: Ack moves from the row to an incident panel
status: done
plan: R2, R2a
---

Step-one recording (00:20): with the pointer on INC-8638's Ack, a new incident landed at the top and the
click acked INC-7898. Product decided: new incidents stay live at the top; a row opens its incident panel,
and Ack lives there.

- Clicking a row opens the panel (`data-testid="incident-panel"`), which names the incident id.
- The panel's Ack (`data-testid="panel-ack"`) acks the incident the panel names; the row shows `acked`.
- Rows carry no Ack button (`ack` retired). Existing rows are never moved or removed.

Acceptance: a row that moves while a person aims can only open the wrong panel, which names the wrong id;
it can never ack the wrong incident.
