import { Provider } from "jotai";
import { Board } from "./components/Board";
import { ludoStore } from "./utils/atoms";
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";

function App() {
  return (
    <Provider store={ludoStore}>
      <DevTools store={ludoStore} />
      <main className="grid h-screen place-items-center">
        <Board />
      </main>
    </Provider>
  );
}

export default App;
