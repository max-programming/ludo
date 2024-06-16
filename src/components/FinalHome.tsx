import { Home } from "lucide-react";

export function FinalHome() {
  return (
    <div
      className="relative border-gray-700 flex-1 *:absolute *:size-12 *:border *:border-gray-700 *:grid *:place-items-center"
      id="final_home"
    >
      <div className="bg-red-300 top-12 box home">
        <Home size={35} className="text-red-900 stroke-1" />
      </div>
      <div className="bg-green-300 left-12 box home">
        <Home size={35} className="text-green-900 stroke-1" />
      </div>
      <div className="right-0 bg-yellow-300 top-12 box home">
        <Home size={35} className="text-yellow-900 stroke-1" />
      </div>
      <div className="bottom-0 bg-blue-300 left-12 box home">
        <Home size={35} className="text-blue-900 stroke-1" />
      </div>
    </div>
  );
}
