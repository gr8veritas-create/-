import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface PlotlyChartProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: React.CSSProperties;
  className?: string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout,
  config,
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mergedConfig: Partial<Plotly.Config> = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      displaylogo: false,
      locale: 'ja',
      toImageButtonOptions: {
        format: 'png',
        filename: 'impactsynth_chart',
        height: 600,
        width: 1000,
        scale: 2,
      },
      ...config,
    };

    const mergedLayout: Partial<Plotly.Layout> = {
      autosize: true,
      margin: { l: 50, r: 20, t: 30, b: 50 },
      font: { family: 'Noto Sans JP, Plus Jakarta Sans, sans-serif' },
      hovermode: 'x unified',
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#fafcff',
      ...layout,
    };

    Plotly.react(containerRef.current, data, mergedLayout, mergedConfig);

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            Plotly.Plots.resize(containerRef.current);
          }
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      className={`w-full h-full min-w-0 max-w-full overflow-hidden ${className || ''}`}
    />
  );
};
