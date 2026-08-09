# Spruce household energy comparison

React and TypeScript prototype for comparing a household's current heat-pump, solar, and battery setup with proposed
solar and battery additions.

## Data model

The form uses a UI-only draft for conditional Yes/No questions. On submission it is validated and mapped into a
`HouseholdAssessment` with separate `current` and `proposed` energy assets. Solar and battery systems use the same shape
in either collection; scenario composition determines whether they are installed or proposed.

System totals are derived rather than persisted:

- solar capacity = panel count × panel capacity in kW;
- battery capacity = unit count × unit capacity in kWh.

Proposed solar assumes `0.4 kW` peak capacity per panel. This follows a recent UK local-authority analysis that models
modern domestic panels at 0.4 kWp and approximately 330 kWh annual generation under its stated PVGIS assumptions. See
the [Exeter City Council analysis](https://committees.exeter.gov.uk/documents/g7902/Public%20reports%20pack%2011th-Sep-2025%2017.30%20Strategic%20Scrutiny%20Committee.pdf).

## Daily simulation

The calculator runs a sequential, one-hour-step simulation over an illustrative day. Household electricity excludes
battery charging in the chart. Solar serves the household first, while battery charging and discharging are displayed as
separate flows.

Battery dispatch uses these fixed assumptions per unit:

- 5 kW maximum charge and discharge power;
- 95% charging efficiency and 95% discharging efficiency;
- 10% minimum reserve and starting state of charge;
- value-aware grid charging from 00:00–05:00, capped by forecast peak demand unless peak export is also profitable;
- charging from surplus solar when its later value exceeds immediate export income;
- discharge from 16:00–19:00, serving the household before exporting economically eligible energy;
- no simultaneous battery charging and discharging during the peak period.

Grid-enabled EVs use a 7 kW maximum discharge rate, 95% charge and discharge efficiency, and a 50% driving reserve. They
serve household peak demand before exporting remaining economically eligible energy.

Grid import/export and battery state of charge are calculated internally even though the chart currently focuses on
electricity, solar, battery charging, and battery discharging.

## Demand and bill estimates

The entered monthly electricity cost is treated as the homeowner's current supplier bill, including standing charges but
excluding separately paid export earnings. The calculator scales the entire illustrative demand profile until the
current-equipment simulation reproduces that supplier bill. The same calibrated demand is then used for every proposed
scenario.

The default is an illustrative smart import/export tariff designed to demonstrate time-shifting with batteries and
bidirectional EVs:

- 12p/kWh from 00:00–07:00;
- 31.61p/kWh from 07:00–00:00;
- 56.95p/day standing charge;
- 16p/kWh exported from 16:00–19:00;
- 9p/kWh exported at other times.

The peak/off-peak export structure is informed by Octopus Prime Outgoing's published 16p/kWh rate from 16:00–19:00 and
9p/kWh rate at other times. The combined defaults are illustrative and do not represent a quotation or claim that a
supplier offers this exact import/export pairing.
See [Octopus Outgoing tariffs](https://octopus.energy/smart/outgoing/).

For each scenario, supplier charges and export earnings are shown separately, followed by their net cost. Monthly
figures repeat the representative day by `365 ÷ 12`; annual figures repeat it by `365`.

## Calculation limits

Demand, EV, heat-pump, and solar profiles remain illustrative. Tariff rates vary by supplier, region, payment method,
and date, while real solar generation varies by weather, season, orientation, and shading. The displayed bills are
decision-support estimates rather than quotations and do not include equipment purchase, installation, maintenance, or
financing costs.

## Commands

```sh
npm run dev
npm test
npm run build
npm run lint
```
