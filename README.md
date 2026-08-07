# Spruce household energy comparison

React and TypeScript prototype for comparing a household's current heat-pump, solar, and battery setup with proposed solar and battery additions.

## Data model

The form uses a UI-only draft for conditional Yes/No questions. On submission it is validated and mapped into a `HouseholdAssessment` with separate `current` and `proposed` energy assets. Solar and battery systems use the same shape in either collection; scenario composition determines whether they are installed or proposed.

System totals are derived rather than persisted:

- solar capacity = panel count × panel capacity in kW;
- battery capacity = unit count × unit capacity in kWh.

Proposed solar currently assumes exactly `123 kW` per panel. This is an explicit prototype assumption.

## Daily simulation

The calculator runs a sequential, one-hour-step simulation over an illustrative day. Household electricity excludes battery charging in the chart. Solar serves the household first, while battery charging and discharging are displayed as separate flows.

Battery dispatch uses these fixed assumptions per unit:

- 5 kW maximum charge and discharge power;
- 95% charging efficiency and 95% discharging efficiency;
- 10% minimum reserve and starting state of charge;
- grid charging from 00:00–05:00 to a 50% state-of-charge target;
- charging from surplus solar outside the peak period, up to full capacity;
- discharge from 16:00–19:00, serving the household before exporting remaining permitted energy;
- no simultaneous battery charging and discharging during the peak period.

Grid import/export and battery state of charge are calculated internally even though the chart currently focuses on electricity, solar, battery charging, and battery discharging.

## Calculation limits

Demand, EV, heat-pump, and solar profiles remain illustrative. The simulation does not yet use tariff prices, annualisation, weather, seasonal generation, or calculate financial savings.

## Commands

```sh
npm run dev
npm test
npm run build
npm run lint
```
