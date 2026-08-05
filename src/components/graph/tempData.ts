export type GraphData = {
    name: string;
    gas: number;
    solar: number;
    battery: number;
    electricity: number;
    evCharging: number;
};

// Energy for each hour in Wh. Positive values are household demand; negative
// values are generation or battery charging.
export const tempData: GraphData[] = [
    {name: '00:00', gas: 180, solar: 0, battery: 80, electricity: 160, evCharging: 1800},
    {name: '01:00', gas: 170, solar: 0, battery: 70, electricity: 140, evCharging: 1800},
    {name: '02:00', gas: 160, solar: 0, battery: 60, electricity: 130, evCharging: 1800},
    {name: '03:00', gas: 160, solar: 0, battery: 50, electricity: 130, evCharging: 1800},
    {name: '04:00', gas: 170, solar: 0, battery: 40, electricity: 140, evCharging: 0},
    {name: '05:00', gas: 230, solar: 0, battery: 70, electricity: 180, evCharging: 0},
    {name: '06:00', gas: 520, solar: 0, battery: 180, electricity: 420, evCharging: 0},
    {name: '07:00', gas: 760, solar: 0, battery: 220, electricity: 520, evCharging: 0},
    {name: '08:00', gas: 620, solar: -120, battery: 100, electricity: 380, evCharging: 0},
    {name: '09:00', gas: 330, solar: -360, battery: -120, electricity: 250, evCharging: 0},
    {name: '10:00', gas: 220, solar: -620, battery: -280, electricity: 220, evCharging: 0},
    {name: '11:00', gas: 180, solar: -850, battery: -400, electricity: 230, evCharging: 0},
    {name: '12:00', gas: 170, solar: -980, battery: -450, electricity: 300, evCharging: 0},
    {name: '13:00', gas: 180, solar: -900, battery: -420, electricity: 280, evCharging: 0},
    {name: '14:00', gas: 190, solar: -700, battery: -300, electricity: 230, evCharging: 0},
    {name: '15:00', gas: 210, solar: -460, battery: -120, electricity: 240, evCharging: 0},
    {name: '16:00', gas: 330, solar: -220, battery: 40, electricity: 300, evCharging: 0},
    {name: '17:00', gas: 620, solar: -60, battery: 220, electricity: 520, evCharging: 0},
    {name: '18:00', gas: 900, solar: 0, battery: 360, electricity: 680, evCharging: 0},
    {name: '19:00', gas: 1080, solar: 0, battery: 420, electricity: 720, evCharging: 0},
    {name: '20:00', gas: 940, solar: 0, battery: 360, electricity: 560, evCharging: 0},
    {name: '21:00', gas: 620, solar: 0, battery: 260, electricity: 380, evCharging: 0},
    {name: '22:00', gas: 350, solar: 0, battery: 160, electricity: 240, evCharging: 0},
    {name: '23:00', gas: 230, solar: 0, battery: 100, electricity: 180, evCharging: 0},
];
