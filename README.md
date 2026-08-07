# Spruce household energy comparison

React and TypeScript prototype for comparing a household's current heat-pump, solar, and battery setup with proposed solar and battery additions.

## Data model

The form uses a UI-only draft for conditional Yes/No questions. On submission it is validated and mapped into a `HouseholdAssessment` with separate `current` and `proposed` energy assets. Solar and battery systems use the same shape in either collection; scenario composition determines whether they are installed or proposed.

System totals are derived rather than persisted:

- solar capacity = panel count × panel capacity in kW;
- battery capacity = unit count × unit capacity in kWh.

Proposed solar currently assumes exactly `123 kW` per panel. This is an explicit prototype assumption.

## Calculation limits

The charts use scaled, illustrative 24-hour profiles. They are not yet a physical battery simulation or a financial savings calculation. Battery state of charge, efficiency, tariffs, grid import/export, weather, and seasonal generation remain future work.

## Commands

```sh
npm run dev
npm test
npm run build
npm run lint
```
