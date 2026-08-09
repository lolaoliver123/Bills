# Spruce household energy comparison

React and TypeScript prototype for comparing a household's current heat-pump, solar, and battery setup with proposed
solar and battery additions.

Vite prints the local development URL, normally `http://localhost:5173`.

## Project structure

- `src/app`: application providers, routing, and global styles;
- `src/components/ui`: reusable UI primitives;
- `src/features/household-energy-comparison/components`: form and result presentation;
- `src/features/household-energy-comparison/models`: form, assessment, asset, billing, and simulation types;
- `src/features/household-energy-comparison/calculations`: tariff, billing, profile, and dispatch logic;
- `tests`: Vitest unit tests mirroring the feature structure.

Submitted answers and results are stored in React memory only. Reloading the results route clears the assessment and
returns to the setup form.

## Data model

The form uses a UI-only draft for conditional Yes/No questions. On submission it is validated and mapped into a
`HouseholdAssessment` with separate `current` and `proposed` energy assets. Solar and battery systems use the same shape
in either collection; scenario composition determines whether they are installed or proposed.

System totals are derived rather than persisted:

- solar capacity = panel count × panel capacity in kW;
- battery capacity = unit count × unit capacity in kWh.

Proposed solar assumes `0.4 kW` peak capacity per panel. A 10-panel proposal therefore produces the UK-government
reference system size of `4 kWp`. The representative hourly solar shape is normalized to `850 kWh/kWp/year` before
being scaled to the entered installation size. This is a national illustrative yield and does not adjust for postcode,
roof direction, pitch, shading, or yearly weather.

The panel assumption follows a recent UK local-authority analysis that models
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
- value-aware grid charging during the configured cheap period (00:00–07:00 by default), capped by forecast peak demand
  unless peak export is also profitable;
- charging from surplus solar when its later value exceeds immediate export income;
- discharge from 16:00–19:00, serving the household before exporting economically eligible energy;
- no simultaneous battery charging and discharging during the peak period.

Grid-enabled EVs use a 7 kW maximum discharge rate, 95% charge and discharge efficiency, and a 50% driving reserve. They
serve household peak demand before exporting remaining economically eligible energy.

Grid import/export and battery state of charge are calculated internally even though the chart currently focuses on
electricity, solar, battery charging, and battery discharging.

## Demand and bill estimates

Heat-pump electricity is derived from the EPC-style annual space-heating demand, plus annual hot-water demand when the
heat pump supplies it, divided by the entered seasonal coefficient of performance (SCOP). SCOP defaults to `2.8`, the
assumption used in the UK government's Warm Homes Plan technical annex. Rated heat-pump capacity affects the described
installation but is not used as a proxy for annual consumption.

Each EV charge entered per week means one full battery-equivalent charge. Fractional values can represent partial
charging. Grid charging includes the modeled 95% charging loss.

The entered monthly electricity cost is treated as the homeowner's current supplier bill, including standing charges but
excluding separately paid export earnings. The calculator scales the general household demand profile until the
current-equipment simulation reproduces that supplier bill. Known heat-pump and EV demand are held fixed while the
otherwise-unmeasured general household demand is calibrated. The same calibrated demand is then used for every proposed
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

Monthly electricity-bill input is limited to `£2,000`.

## Calculation limits

Demand, EV, heat-pump, and solar profiles remain illustrative. Tariff rates vary by supplier, region, payment method,
and date, while real solar generation varies by weather, season, orientation, and shading. The displayed bills are
decision-support estimates rather than quotations and do not include equipment purchase, installation, maintenance, or
financing costs.

## Commands

```sh
npm run dev          # start the development server
npm test             # run the unit test suite once
npm run build        # type-check and create a production build
npm run preview      # serve the production build locally
npm run lint         # run ESLint
npm run format       # format the repository with Prettier
npm run format:check # check formatting without changing files
```

The tests cover form-to-domain mapping, scenario construction, tariff boundaries, bill calibration, hourly simulation,
storage constraints, and energy conservation. Coverage reporting is available through Vitest's installed V8 provider,
for example with `npm test -- --coverage`.
