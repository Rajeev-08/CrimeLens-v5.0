// frontend/src/views/tabs/SeverityTab.js
import React, { useState, useEffect } from 'react';
import { getSeverityBreakdown } from '../../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const SEVERITY_COLORS = {
    'High': 'rgba(239, 68, 68, 0.7)',  // Red
    'Medium': 'rgba(249, 115, 22, 0.7)', // Orange
    'Low': 'rgba(34, 197, 94, 0.7)',   // Green
};
const SEVERITY_BORDER_COLORS = {
    'High': 'rgba(239, 68, 68, 1)',
    'Medium': 'rgba(249, 115, 22, 1)',
    'Low': 'rgba(34, 197, 94, 1)',
};


const SeverityTab = ({ activeFilters }) => {
    const [pieData, setPieData] = useState(null);
    const [barData, setBarData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!activeFilters) return;
            setIsLoading(true);
            setError('');
            setPieData(null);
            setBarData(null);

            try {
                const response = await getSeverityBreakdown(activeFilters);
                const { pie_chart, bar_chart } = response.data;

                if (!pie_chart.labels || pie_chart.labels.length === 0) {
                    setError("No severity data available for the selected filters.");
                    return;
                }

                // Prepare Pie Chart data
                setPieData({
                    labels: pie_chart.labels,
                    datasets: [{
                        label: 'Crime Count',
                        data: pie_chart.values,
                        backgroundColor: pie_chart.labels.map(l => SEVERITY_COLORS[l] || 'rgba(156, 163, 175, 0.7)'),
                        borderColor: pie_chart.labels.map(l => SEVERITY_BORDER_COLORS[l] || 'rgba(156, 163, 175, 1)'),
                        borderWidth: 1,
                    }],
                });

                // Prepare Bar Chart data
                const barLabels = bar_chart['AREA NAME'];
                const severities = Object.keys(bar_chart).filter(key => key !== 'AREA NAME');

                setBarData({
                    labels: barLabels,
                    datasets: severities.map(severity => ({
                        label: severity,
                        data: bar_chart[severity],
                        backgroundColor: SEVERITY_COLORS[severity] || 'rgba(156, 163, 175, 0.7)',
                    })),
                });

            } catch (err) {
                console.error("Failed to fetch severity data:", err);
                setError("Could not retrieve severity breakdown.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeFilters]);

    const barOptions = {
        plugins: {
            title: {
                display: true,
                text: 'Crime Severity by Area',
            },
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
                title: { display: true, text: 'Area Name' },
            },
            y: {
                stacked: true,
                title: { display: true, text: 'Crime Count' },
            },
        },
    };

    const pieOptions = {
        plugins: {
            title: {
                display: true,
                text: 'Overall Crime Severity Distribution',
            },
        },
        responsive: true,
    };

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Crime Severity Breakdown</h3>

            {isLoading && <p className="text-center text-gray-500">Loading charts...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!isLoading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        {pieData && <Pie options={pieOptions} data={pieData} />}
                    </div>
                    <div className="lg:col-span-3">
                        {barData && <Bar options={barOptions} data={barData} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeverityTab;