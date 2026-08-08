# Spruce household energy comparison

React and TypeScript prototype for comparing a household's current heat-pump, solar, and battery setup with proposed solar and battery additions.

## Data model

The form uses a UI-only draft for conditional Yes/No questions. On submission it is validated and mapped into a `HouseholdAssessment` with separate `current` and `proposed` energy assets. Solar and battery systems use the same shape in either collection; scenario composition determines whether they are installed or proposed.

System totals are derived rather than persisted:

- solar capacity = panel count × panel capacity in kW;
- battery capacity = unit count × unit capacity in kWh.

Proposed solar assumes `0.4 kW` peak capacity per panel. This follows a recent UK local-authority analysis that models modern domestic panels at 0.4 kWp and approximately 330 kWh annual generation under its stated PVGIS assumptions. See the [Exeter City Council analysis](https://committees.exeter.gov.uk/documents/g7902/Public%20reports%20pack%2011th-Sep-2025%2017.30%20Strategic%20Scrutiny%20Committee.pdf).

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

## Demand and bill estimates

The entered monthly electricity cost is treated as the homeowner's current supplier bill, including standing charges but excluding separately paid export earnings. The calculator scales the entire illustrative demand profile until the current-equipment simulation reproduces that supplier bill. The same calibrated demand is then used for every proposed scenario.

The default tariff uses representative Great Britain Economy 7 direct-debit rates effective 1 July to 30 September 2026:

- 14.53p/kWh from 00:00–07:00;
- 31.61p/kWh from 07:00–00:00;
- 56.95p/day standing charge;
- 12.86p/kWh exported electricity.

The Economy 7 figures are based on the current multi-rate price-cap averages described in the [British Gas Economy 7 guide](https://www.scottishgas.co.uk/energy/guides/economy-7-meters-explained.html). Ofgem explains how [single-rate and multi-rate price caps](https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges) operate.

The export default is derived from Ofgem's reported £56.97 million of payments for 443.1 GWh exported under the Smart Export Guarantee: £56.97m ÷ 443.1 GWh = approximately 12.86p/kWh. See the [Ofgem SEG annual report](https://www.ofgem.gov.uk/cy/transparency-document/smart-export-guarantee-annual-report-april-2024-march-2025).

For each scenario, supplier charges and export earnings are shown separately, followed by their net cost. Monthly figures repeat the representative day by `365 ÷ 12`; annual figures repeat it by `365`.

## Calculation limits

Demand, EV, heat-pump, and solar profiles remain illustrative. Tariff rates vary by supplier, region, payment method, and date, while real solar generation varies by weather, season, orientation, and shading. The displayed bills are decision-support estimates rather than quotations and do not include equipment purchase, installation, maintenance, or financing costs.

## Commands

```sh
npm run dev
npm test
npm run build
npm run lint
```
