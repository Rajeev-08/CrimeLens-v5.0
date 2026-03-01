import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ComparisonTab = ({ activeFilters }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://127.0.0.1:8000/api/comparison', activeFilters);
                setData(response.data);
            } catch (error) {
                console.error("Comparison load error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (activeFilters) fetchData();
    }, [activeFilters]);

    if (loading || !data) return <div className="p-10 text-center text-gray-500">Calculating Year-over-Year Trends...</div>;

    // Chart Configuration
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, data.chartData.current.length),
        datasets: [
            {
                label: 'This Period',
                data: data.chartData.current,
                borderColor: 'rgb(59, 130, 246)', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            },
            {
                label: 'Previous Period',
                data: data.chartData.previous,
                borderColor: 'rgb(156, 163, 175)', // Grey
                borderDash: [5, 5], // Dotted Line
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Seasonal Volume Comparison' }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="p-4">
            {/* 1. STAT CARDS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {data.stats.map((stat, idx) => (
                    <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-gray-500 text-sm font-medium uppercase tracking-wide">{stat.label}</div>
                        
                        <div className="flex items-end gap-2 mt-2">
                            <span className="text-2xl font-bold text-gray-800">{stat.current}</span>
                            
                            {/* The "Diff" Badge */}
                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                // Logic: Crime going DOWN is Good (Green), UP is Bad (Red)
                                stat.trend === 'down' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {stat.trend === 'up' ? '▲' : '▼'} {Math.abs(stat.change)}%
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">vs. {stat.previous} previous period</div>
                    </div>
                ))}
            </div>

            {/* 2. CHART ROW */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <Line data={chartData} options={options} height={80} />
            </div>
        </div>
    );
};

export default ComparisonTab;