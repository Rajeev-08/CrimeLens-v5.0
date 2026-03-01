// frontend/src/views/tabs/TimeSeriesTab.js
import React, { useState, useEffect } from 'react';
import { getTimeSeries } from '../../services/api';
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
    Filler, // Required for filling area charts (confidence interval)
} from 'chart.js';

// Register all necessary Chart.js components
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

const TimeSeriesTab = ({ activeFilters }) => {
    const [chartData, setChartData] = useState(null);
    const [showForecast, setShowForecast] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!activeFilters) return;
            setIsLoading(true);
            setError('');
            setChartData(null);

            try {
                const response = await getTimeSeries(activeFilters);
                const { counts, forecast } = response.data;

                if (counts.length === 0) {
                    setError("No time-series data available for the selected filters.");
                    return;
                }

                // Combine historical and forecast labels, ensuring no duplicates
                const allLabels = [...counts.map(d => d.ds), ...forecast.map(d => d.ds)];
                const uniqueLabels = [...new Set(allLabels)].sort();
                const formattedLabels = uniqueLabels.map(ds => new Date(ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

                // Create a map for quick lookup of historical data
                const countsMap = new Map(counts.map(item => [item.ds, item.y]));

                setChartData({
                    labels: formattedLabels,
                    datasets: [
                        {
                            label: 'Confidence Interval',
                            data: uniqueLabels.map(ds => {
                                const forecastPoint = forecast.find(f => f.ds === ds);
                                return forecastPoint ? [forecastPoint.yhat_lower, forecastPoint.yhat_upper] : [null, null];
                            }),
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 0)',
                            pointRadius: 0,
                            fill: 0, // Fill to the next dataset in the array
                        },
                        {
                            label: 'Forecast',
                            data: uniqueLabels.map(ds => forecast.find(f => f.ds === ds)?.yhat ?? null),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderDash: [5, 5], // Dashed line for forecast
                        },
                        {
                            label: 'Actual Crime Count',
                            data: uniqueLabels.map(ds => countsMap.get(ds) ?? null),
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            tension: 0.1,
                        },
                    ],
                });

            } catch (err) {
                console.error("Failed to fetch time-series data:", err);
                setError("Could not retrieve time-series data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeFilters]);

    // Filter datasets based on the showForecast state
    const finalChartData = chartData
        ? {
              ...chartData,
              datasets: showForecast
                  ? chartData.datasets
                  : [chartData.datasets.find(ds => ds.label === 'Actual Crime Count')], // Only show actuals
          }
        : null;

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Crime Counts and 12-Month Forecast',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of Crimes',
                },
            },
        },
    };

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Time-Series Trend Analysis</h3>
            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id="showForecast"
                    checked={showForecast}
                    onChange={() => setShowForecast(!showForecast)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showForecast" className="ml-2 block text-sm text-gray-900">
                    Show 12-Month Forecast
                </label>
            </div>

            {isLoading && <p className="text-center text-gray-500">Loading chart data...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {finalChartData && !isLoading && !error && <Line options={options} data={finalChartData} />}
        </div>
    );
};

export default TimeSeriesTab;