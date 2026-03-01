import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

export const generatePDF = async (activeFilters, dashboardRef, totalRecords) => {
    try {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();
        
        // 1. Fetch AI Executive Summary
        // We guess the "Trend" based on record count for now to keep it simple
        const trend = totalRecords > 500 ? "High Activity" : "Moderate Activity";
        
        let aiSummary = "Generating analysis...";
        try {
            const res = await axios.post('http://localhost:8000/api/generate-report-summary', {
                area: activeFilters.areas.length > 0 ? activeFilters.areas[0] : "All City",
                crime_types: activeFilters.crimes,
                total_crimes: totalRecords,
                top_trend: trend
            });
            aiSummary = res.data.summary;
        } catch (err) {
            console.error("Summary failed", err);
            aiSummary = "Automated summary unavailable. Proceeding with data export.";
        }

        // --- PDF LAYOUT ---

        // Header
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185); // Professional Blue
        doc.text("CRIME INTELLIGENCE REPORT", 105, 20, null, null, "center");
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated: ${date}`, 105, 30, null, null, "center");

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35); // Separator line

        // Section 1: Executive Summary
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("1. Executive Summary", 20, 45);
        
        doc.setFontSize(11);
        doc.setTextColor(60);
        // splitTextToSize wraps text automatically
        const splitText = doc.splitTextToSize(aiSummary, 170); 
        doc.text(splitText, 20, 55);

        // Section 2: Current View Snapshot
        // We capture whatever chart/map is currently visible on screen
        const summaryHeight = splitText.length * 7;
        const imageY = 60 + summaryHeight;

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("2. Data Visualization Snapshot", 20, imageY);

        if (dashboardRef.current) {
            const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            // Fit image to page width
            const imgWidth = 170; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            doc.addImage(imgData, 'PNG', 20, imageY + 10, imgWidth, imgHeight);
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("CONFIDENTIAL - FOR OFFICIAL USE ONLY", 105, 290, null, null, "center");

        // Save
        doc.save(`CrimeReport_${date.replace(/\//g, '-')}.pdf`);
        return true;

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Check console for details.");
        return false;
    }
};