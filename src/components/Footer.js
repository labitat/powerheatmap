import React from 'react'

export default function Footer(){
  return (
    <div className="jumbotron">
      <p>
        <small>
          The site uses data from and is inspired by <a href="https://power.labitat.dk" target="_blank" rel="noopener noreferrer">power.labitat.dk</a>,
          which has a wonderfully well-descriped <a href="https://github.com/labitat/blipserver" target="_blank" rel="noopener noreferrer">API</a>.
        </small>
      </p>
      <p>
        <small>
        <a target="_blank" rel="noopener noreferrer" href="https://github.com/jacobkjaersgaardhansen/labitat/tree/master/power">Made</a> by Jacob for the community around <a href="https://labitat.dk" target="_blank" rel="noopener noreferrer">Labitat</a> in Copenhagen.
        </small>
      </p>
    </div>
  )
}