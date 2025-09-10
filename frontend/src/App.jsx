import GraphView from "./components/GraphView";
import Header from "./components/Header";

function App() {
  return (
    <div className="bg-[#0F0F0F] max-h-screen overflow-scroll ">
      <Header />
      <GraphView />
    </div>
  );
}

export default App;
