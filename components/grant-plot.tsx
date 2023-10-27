import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { formatAmount } from "../api/utils";

export default function GrantPlot({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const { height, width } = useWindowDimensions();

  const colors = Array(20)
    .fill([
      "#373EE8",
      "#F17A4C",
      "#FADBCF80",
      "#441151",
      "#7D70BA",
      "#6060D3",
      "#F6B79D",
      "#452103",
      "#F8D66E",
      "#F7C6EC",
      "#CA61C3",
      "#769883",
      "#EFCFE3",
      "#EAF2D7",
      "#B3DEE2",
      "#2EC4B6",
      "#883677",
      "#FFBF00",
      "#ACF7C1",
      "#F2CCC3",
      "#3F84E5",
      "#DEC1FF",
      "#03B5AA",
      "#F2E86D",
      "#86BA90",
      "#5C0029",
      "#8AA29E",
      "#7C6A0A",
    ])
    .flat();

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

  var parents = Array(values.length).fill("");

  return (
    <div className="bg-sand w-full">
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

              colors
            },
          },
        ]}
        layout={layout}
      />
    </div>
  );
}
