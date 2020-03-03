import React from 'react';
import './bootstrap.css';
import Table from './components/Table';
import Heatmap from './components/Heatmap';
import Footer from './components/Footer';
import './Extra.css';

function App() {
  return (
    <div>
      <Heatmap />
      <Table />
      <Footer />
    </div>
  );
}

export default App;
