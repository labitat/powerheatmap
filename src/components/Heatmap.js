import React, { useState, useEffect } from 'react';

const default_thresholdIgnore = "500"; // W
const default_thresholdSaturation = "1700"; // W
const range_max = 3000; // W
const range_handle_width = 16; // px
const range_width = 250; // px
const color_schemes = [
  ['black', 'black', 'red', 'red'],
  ['white', 'rgb(204, 255, 204)', 'rgb(0, 153, 0)', 'rgb(0, 153, 0)']
];

/**
 * Used to translate any css compliant color string into three rgb integers,
 * which can be used for further computations. It's ugly and annoying that you
 * have to do this yourself. A well-defined color object should be built into Javascript.
 * @param {string} color Any css compliant color string, e.g. "blue", "rgb(1,2,3)", "hsl(12,30%,12%)", "#FF00AA", "#AFF"
 */
function translateColor(color){
  const element = document.getElementById("hiddenUsedToGetColors")
  element.style.color = color;
  const stringRGB = getComputedStyle(element).color;
  const stringSplitted = stringRGB.split(',');
  const red = stringSplitted[0].substring(4);
  const green = stringSplitted[1].substring(1);;
  const blue = stringSplitted[2].substring(1, stringSplitted[2].length - 1);
  return [red, green, blue]
}

/**
 * Gets the definition of a linear function from two points (x1, y1) and (x2, y2)
 */
function linear(x1, x2, y1, y2, x){
  const a = (y2 - y1) / (x2 - x1);
  const b = y1 - a * x1;
  const y = a * x + b;
  return { a, b, y }
}

/**
 * Interpolate colors linearly
 */
function interpolate(color_start, color_end, start, end, current){
  const [r_start, g_start, b_start] = translateColor(color_start);
  const [r_end, g_end, b_end] = translateColor(color_end);
  const r_current = linear(start, end, r_start, r_end, current).y;
  const g_current = linear(start, end, g_start, g_end, current).y;
  const b_current = linear(start, end, b_start, b_end, current).y;
  return `rgb(${r_current}, ${g_current}, ${b_current})`
}


export default function Heatmap(){
  const [dateStart, setdateStart] = useState('2020-01-01');
  const [dateEnd, setdateEnd] = useState(new Date().toISOString().substring(0, 10));
  const [thresholdIgnore, setThresholdIgnore] = useState(default_thresholdIgnore);
  const [thresholdSaturation, setThresholdSaturation] = useState(default_thresholdSaturation);
  const [isSimple, setIsSimple] = useState(1);
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const timeStart = new Date(dateStart).setHours(0);
    const timeEnd = new Date(dateEnd).setHours(23, 59, 59, 999);
    const getHourly = async () => {
      const response = await fetch(`https://power.labitat.dk/hourly/${timeStart}/${timeEnd}`);
      response.status === 200 && setData(await response.json());
    };
    timeStart > 0 && timeEnd > 0 && getHourly(); // only fetch data if timeStart and timeEnd are proper integers
  }, [dateStart, dateEnd]);
  
  const dataEnriched = data.map(d => {
    const timestamp = new Date(d[0]);
    return { 
      timeslot: timestamp.getHours(),
      day: (timestamp.getDay() + 6) % 7, // moving Sunday to end of week instead of start of week
      powerConsumption: d[2],
      longestBlipGap: d[4],
      shortestBlipGap: d[3],
      timestamp,
      blipsCount: d[1]
    }
  });

  const colorIgnore = color_schemes[isSimple][0];
  const colorLow = color_schemes[isSimple][1];
  const colorHigh = color_schemes[isSimple][2];
  const colorSaturation = color_schemes[isSimple][3];
  const colorInterpolate = x => interpolate(color_schemes[isSimple][1], color_schemes[isSimple][2], thresholdIgnore, thresholdSaturation, x);
  const colorHeat = x => {
    return x < thresholdIgnore ? colorIgnore : 
      x > thresholdSaturation ? colorSaturation :
      colorInterpolate(x);
  }

  const rows = [];
  for (let timeslot = 0; timeslot < 24; timeslot++){
    const days = [];
    for (let day = 0; day < 7; day++){
      const dataPoints = dataEnriched.filter(d => d.timeslot === timeslot && d.day === day);
      const powerConsumption = dataPoints.reduce((avg, value, _, { length }) => avg + value.powerConsumption / length, 0);
      days.push(dataPoints.length > 0 ? 
        <td key={day} style={{
          color: powerConsumption - thresholdIgnore < (thresholdSaturation - thresholdIgnore) / 3 * 2 ? 'lightgrey' : 'black', 
          backgroundColor: colorHeat(powerConsumption), 
          textAlign: 'center',
          width: "11%",
        }}>{isSimple ? null : powerConsumption.toFixed()}</td> :
        <td key={day} style={{ width: "11%" }}></td>
      )
    }
    rows.push(
      <tr key={timeslot}>
        <td id="tdVerbose" style={{ textAlign: 'center' }}>{timeslot}:00 - {timeslot+1}:00</td>
        <td id="tdConcise" style={{ textAlign: 'center' }}>{timeslot} - {timeslot+1}</td>
        {days}
      </tr>
    )
  }
  
  return (
    <div className="jumbotron">
      <div style={{ maxWidth: "600px" }}>
        <h3>{isSimple ? 'Labitat usage': 'Average power usage during the week'}</h3>
        <p>{isSimple ? 'The table shows when it is most likely to find others \
          in Labitat. ': "The table shows the average power usage in watts across \
          a week's 24 times 7 hourly timeslots. "}
          The color saturation indicates the expected activity.
        </p>
        <p>{isSimple ? 'The expactation is based on' : 'The averages are calculated across'} the given range including both days.</p>
        <form style={{ maxWidth: "350px" }}>
          <fieldset>
            <div className="form-group">
              <label htmlFor="range">Range</label>
              <div id="range" style={{ display: "flex", flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
                <input id='start' type="date" className="form-control" style={{ maxWidth: "170px" }} value={dateStart} onChange={e => setdateStart(e.target.value)} />  
                <input id='end' type="date" className="form-control" style={{ maxWidth: "170px" }} value={dateEnd} onChange={e => setdateEnd(e.target.value)} />
              </div>
            </div>
          </fieldset>
        </form>
        <form>
          <fieldset className="form-group">
            <div className="form-check">
              <label className="form-check-label">
                <input 
                  id='simpleView' 
                  className="form-check-input" 
                  type="checkbox"  
                  checked={!isSimple} 
                  onChange={() => setIsSimple(prev => 1 - prev)} 
                />
                Detailed view
              </label>
            </div>
          </fieldset>
        </form>
      </div>
      <table style={{ 
        width: "100%", 
        textAlign: "center", 
        marginBottom: "20px" 
        }}
      >
        <thead>
          <tr>
            <th>Timeslot</th>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
            <th>Sat</th>
            <th>Sun</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
      <div style={{ maxWidth: "600px" }}>
        <form style={{ maxWidth: range_width }}>
          <fieldset className="form-group">
            <label htmlFor="thresholds">Thresholds</label>
            <div id="thresholds">
              <input 
                id='ignore' 
                className="custom-range" 
                type="range" 
                min="0" 
                max={thresholdSaturation} 
                step="100" 
                style={{ 
                  width: `${(range_width - 2 * range_handle_width) * (thresholdSaturation) / range_max + range_handle_width}px`, 
                  position: "absolute" 
                }} 
                value={thresholdIgnore} 
                onChange={e => setThresholdIgnore(e.target.value)} 
              />
              <input 
                id='saturation' 
                className="custom-range" 
                type="range" 
                min={thresholdIgnore} 
                max={range_max} 
                step="100" 
                style={{ 
                  width: `${(range_width - 2 * range_handle_width) * (range_max - thresholdIgnore) / range_max + range_handle_width}px`, 
                  float: "right" 
                }} 
                value={thresholdSaturation} 
                onChange={e => setThresholdSaturation(e.target.value)} 
              />
            </div>
          </fieldset>
        </form>
        <div style={{ maxWidth: range_width, height: "3rem" }}>
          <div className="bars">
            <div className="color-bar" style={{ backgroundColor: colorIgnore, width: `${(range_width - 2 * range_handle_width ) * thresholdIgnore / range_max + range_handle_width / 2}px` }}></div>
            <div className="color-bar" style={{ backgroundImage: `linear-gradient(to right, ${colorLow}, ${colorHigh})`, width: `${(range_width - 2 * range_handle_width ) * (thresholdSaturation - thresholdIgnore) / range_max + range_handle_width}px` }}></div>
            <div className="color-bar" style={{ backgroundColor: colorSaturation, width: `${(range_width - 2 * range_handle_width ) * (range_max - thresholdSaturation) / range_max + range_handle_width / 2}px` }}></div>
          </div>
          <div style={{ position: "absolute", height: "1rem" }}>
            <p style={{ textAlign: "center", position: "absolute", left: `${(range_width ) * thresholdIgnore / range_max }px`, transform: "translate(-50%)" }}>{thresholdIgnore}</p>
            <p style={{ textAlign: "center", position: "absolute", left: `${(range_width ) * thresholdSaturation / range_max }px`, transform: "translate(-50%)" }}>{thresholdSaturation}</p>
          </div>
        </div>
      </div>
      <div id="hiddenUsedToGetColors"></div>
    </div>
  )
}