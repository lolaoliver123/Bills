import {
    Bar,
    BarChart,
    CartesianGrid,
    ReferenceLine,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type {GraphData} from './tempData.ts';

type NetBarChartProps = {
    data: GraphData[];
};

const NetBarChart = ({data}: NetBarChartProps) => (
    <BarChart width={1000} height={600} data={data} stackOffset="sign" margin={{top: 20, right: 30, left: 30, bottom: 5}}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="hour" type="number" domain={[(dataMin) => dataMin - 0.5, (dataMax) => dataMax + 0.5]} tickCount={24}
               tickFormatter={(hour) => `${String(hour).padStart(2, '0')}:00`}/>
        <YAxis unit=" Wh"/>
        <Tooltip/>
        <ReferenceLine y={0} stroke="#000"/>
        <Bar dataKey="electricity" name="General electricity" fill="#3b82f6" stackId="energy"/>
        <Bar dataKey="evCharging" name="EV charging" fill="#ef4444" stackId="energy"/>
        <Bar dataKey="battery" name="Battery" fill="#8b5cf6" stackId="energy"/>
        <Bar dataKey="solar" name="Solar generation" fill="#22c55e" stackId="energy"/>
    </BarChart>
);

export default NetBarChart;
