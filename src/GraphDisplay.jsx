import { useEffect, useState } from "react";
import "./styles/graph.css";

// Cache the dynamic import so it only runs once per session. This avoids
// React 19 StrictMode's double-invoked effects racing and resetting Plot to null.
let plotlyPromise = null;
function loadPlotlyModule() {
    if (!plotlyPromise) {
        plotlyPromise = import("react-plotly.js")
            .then((mod) => mod.default)
            .catch((err) => {
                // Allow a later retry if the import failed
                plotlyPromise = null;
                throw err;
            });
    }
    return plotlyPromise;
}

export default function GraphDisplay({ graphData, onError }) {
    const [plotData, setPlotData] = useState(null);
    const [layout, setLayout] = useState(null);
    const [error, setError] = useState(null);
    const [Plot, setPlot] = useState(null);
    const [plotLoadError, setPlotLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        loadPlotlyModule()
            .then((PlotComponent) => {
                if (isMounted) setPlot(() => PlotComponent);
            })
            .catch(() => {
                if (isMounted) setPlotLoadError(true);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!graphData) {
            setPlotData(null);
            setLayout(null);
            setError(null);
            return;
        }

        if (graphData.error) {
            setError(graphData.error);
            if (onError) onError(graphData.error);
            return;
        }

        try {
            // Convert the backend data format to Plotly format
            const data = Array.isArray(graphData.data) ? graphData.data : [graphData.data];
            setPlotData(data);
            setLayout(graphData.layout || {
                title: "Data Visualization",
                autosize: true,
                margin: { l: 50, r: 50, t: 50, b: 50 }
            });
            setError(null);
        } catch (err) {
            setError("Failed to render graph data");
            if (onError) onError("Failed to render graph data");
        }
    }, [graphData, onError]);

    if (plotLoadError) {
        return (
            <div className="graph-error">
                <p className="graph-error-text">
                    Graphing library failed to load. Run: npm install plotly.js react-plotly.js
                </p>
            </div>
        );
    }

    if (!Plot) {
        return (
            <div className="graph-loading">
                <p className="graph-loading-text">Loading graph...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="graph-error">
                <p className="graph-error-text">{error}</p>
            </div>
        );
    }

    if (!plotData || !layout) {
        return (
            <div className="graph-loading">
                <p className="graph-loading-text">Loading graph...</p>
            </div>
        );
    }

    return (
        <div className="graph-container">
            <Plot
                data={plotData}
                layout={layout}
                config={{
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                    displaylogo: false
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
            />
        </div>
    );
}
