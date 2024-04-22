"use client";
import { useEffect, useState } from "react";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { formatAmount } from "../api/utils";
const Plot = require("react-plotly.js").default;

export default function GrantPlot({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const { height, width } = useWindowDimensions();

  const colors = [
    "#FCD661",
    "#645AD8",
    "#FFC2EE",
    "#25BDCE",
    "#5F94BC",
    "#B3DE9F",
    "#FF9776",
    "#FFEFBE",
    "#D9D6FF",
    "#FFE5F8",
    "#C8F6F6",
    "#D3EDFE",
    "#DBF0DB",
    "#FFD9CE",
    "#FBC624",
    "#6935FF",
    "#FF00B8",
    "#73E2E2",
    "#15B8DC",
    "#248B5A",
    "#FF7043",
  ];

  useEffect(() => {
    window.matchMedia("(min-width: 37.5rem)").matches
      ? setLayout({
          font: { size: 18 },
          showlegend: false,
          displayModeBar: false,
          margin: {
            t: 30,
            b: 25,
            l: 0,
            r: 0,
            pad: 0,
          },
          width: undefined,
          scene: {
            xaxis: {
              spikecolor: "#1fe5bd",
              spikesides: false,
              spikethickness: 6,
            },
            yaxis: {
              spikecolor: "#1fe5bd",
              spikesides: false,
              spikethickness: 6,
            },
            zaxis: {
              spikecolor: "#1fe5bd",
              spikethickness: 6,
            },
          },
        })
      : setLayout({
          font: { size: 18 },
          showlegend: false,
          displayModeBar: false,
          margin: { t: 10, b: 25, l: 0, r: 0, pad: 0 },
          width: width - 120,
          scene: {
            xaxis: {
              spikecolor: "#1fe5bd",
              spikesides: false,
              spikethickness: 6,
            },
            yaxis: {
              spikecolor: "#1fe5bd",
              spikesides: false,
              spikethickness: 6,
            },
            zaxis: {
              spikecolor: "#1fe5bd",
              spikethickness: 6,
            },
          },
        });
  }, [width]);

  const [layout, setLayout] = useState({
    font: { size: 18 },
    showlegend: false,
    displayModeBar: false,
    margin: { t: 30, b: 25, l: 0, r: 0, pad: 0 },
    width: undefined as number | undefined,
    scene: {
      xaxis: {
        spikecolor: "#1fe5bd",
        spikesides: false,
        spikethickness: 6,
      },
      yaxis: {
        spikecolor: "#1fe5bd",
        spikesides: false,
        spikethickness: 6,
      },
      zaxis: {
        spikecolor: "#1fe5bd",
        spikethickness: 6,
      },
    },
  });

  var parents = Array(values?.length).fill("");

  return (
    <div className="bg-sand w-full">
      {values?.length && labels?.length && (
        <Plot
          className={`!bg-sand w-full child:w-full color-sand !child:bg-sand child:max-w-[${
            width - 100
          }px] max-w-[${width - 100}px]`}
          data={[
            {
              type: "treemap",
              labels: labels,
              parents: parents,
              values: values,
              text: values.map(
                (value, i) => `$${formatAmount(value.toFixed(2))}`
              ),
              textinfo: "label+text",
              //@ts-ignore
              hoverinfo: "label+text",
              // hoverlabel: {namelength: -1},
              title: { text: "label" },
              mode: "markers",
              textfont: { size: 18 },
              marker: {
                line: { width: 2 },

                colors,
              },
            },
          ]}
          layout={layout}
        />
      )}
    </div>
  );
}
