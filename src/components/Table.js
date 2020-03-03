import React, { useState, useEffect } from 'react'

const msToLoad = 10000;

export default function Table(){
  const [data, setData] = useState([]);
  useEffect(() => {
    const getLast = async () => {
      const response = await fetch(`https://power.labitat.dk/last/${msToLoad}`);
      response.status === 200 && setData(await response.json());
    };
    getLast();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const getBlip = async () => {
      const response = await fetch('https://power.labitat.dk/blip');
      if(response.status === 200){
        const blip = await response.json();
        setData(d => [...d, blip]);
      }
      cancelled || getBlip();
    }
    getBlip();
    return () => cancelled = true;
  }, []);

  const rows = data.sort((a, b) => b[0] - a[0]).map(d => {
    const id = d[0];
    const timestamp = new Date(d[0]);
    const msSinceLast = d[1];
    const power = 3600000 / msSinceLast;
    return (
      <tr key={id}>
        <td>{timestamp.toLocaleTimeString()}</td>
        <td>{msSinceLast} ms</td>
        <td>{power.toFixed()} W</td>
      </tr>
    )
  })

  return (
    <div className="jumbotron">
      <h3>Latest measurements</h3>
      <table style={{ width: "100%", maxWidth: "400px", textAlign: "center"}}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Time between blips</th>
            <th>Power</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}