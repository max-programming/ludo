import { Provider } from "jotai";
import { Board } from "./components/Board";
import { pawnsStore } from "./utils/atoms";
import { DevTools } from "jotai-devtools";
import "jotai-devtools/styles.css";

function App() {
  return (
    <Provider store={pawnsStore}>
      <DevTools store={pawnsStore} />
      <main className="grid h-screen place-items-center">
        <Board />
      </main>
    </Provider>
  );
}

export default App;
