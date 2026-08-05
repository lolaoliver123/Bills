import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
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
    <BarChart width={500} height={300} data={data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="name"/>
        <YAxis unit=" Wh"/>
        <Tooltip/>
        <Legend/>
        <ReferenceLine y={0} stroke="#000"/>
        <Bar dataKey="gas" name="Gas" fill="#f59e0b" stackId="energy"/>
        <Bar dataKey="solar" name="Solar generation" fill="#22c55e" stackId="energy"/>
        <Bar dataKey="battery" name="Battery" fill="#8b5cf6" stackId="energy"/>
        <Bar dataKey="electricity" name="General electricity" fill="#3b82f6" stackId="energy"/>
        <Bar dataKey="evCharging" name="EV charging" fill="#ef4444" stackId="energy"/>
    </BarChart>
);

export default NetBarChart;
