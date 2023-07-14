import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import useWindowDimensions from '../hooks/useWindowDimensions';

export default function GrantPlot({values, labels}: {values: number[], labels: string[]}) {
  const { height, width } = useWindowDimensions();
  useEffect(() => {
      window.matchMedia("(min-width: 37.5rem)").matches ? setLayout({
      font: {size: 18},
      width: undefined,
      scene:{
        xaxis: {
        spikecolor: '#1fe5bd',
        spikesides: false,
        spikethickness: 6
          },
        yaxis: {
        spikecolor: '#1fe5bd',
        spikesides: false,
        spikethickness: 6
          },
        zaxis: {
        spikecolor: '#1fe5bd',
        spikethickness: 6
          }
      
    }}) : setLayout({
      font: {size: 18},
      width: width - 120,
      scene:{
        xaxis: {
        spikecolor: '#1fe5bd',
        spikesides: false,
        spikethickness: 6
          },
        yaxis: {
        spikecolor: '#1fe5bd',
        spikesides: false,
        spikethickness: 6
          },
        zaxis: {
        spikecolor: '#1fe5bd',
        spikethickness: 6
          }
      
    }});
  }, [width]);

  const [layout, setLayout] = useState({
  font: {size: 18},
  width: undefined as number | undefined,
  scene:{
    xaxis: {
		 spikecolor: '#1fe5bd',
		 spikesides: false,
		 spikethickness: 6
  	 	},
  	 yaxis: {
		 spikecolor: '#1fe5bd',
		 spikesides: false,
		 spikethickness: 6
  		},
  	 zaxis: {
		 spikecolor: '#1fe5bd',
		 spikethickness: 6
  		}
  
  }});


// var labels = ["Eve", "Cain", "Seth", "Enos", "Noam", "Abel", "Awan", "Enoch", "Azura"]
var parents = Array(values.length).fill('');


  return (
    <div className='bg-sand'>
   <Plot 
      className={`!bg-sand color-sand !child:bg-sand child:max-w-[${width - 100}px] max-w-[${width - 100}px]`}
      
      data={[{
        type: "treemap",
        labels: labels,
        parents: parents,
        values:  values,
        textinfo: "label+value+percent",
        textfont: {size: 20},
        marker: {"line": {"width": 2}},
        // pathbar: {"visible": false}
      }]}
      // scrollZoom={true}
      layout={layout}
      // responsive={true}
      />
      </div>
  );
}