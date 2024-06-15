import { InitialHome } from "./InitialHome";
import { PawnArea } from "./PawnArea";
import { PawnButton } from "./Pawns";
import { Card, CardContent } from "./ui/card";
import { DiceView } from "./DiceView";
import { Home } from "lucide-react";
import { useAtomValue } from "jotai";
import { moveLogsAtom } from "@/utils/atoms";

export function Board() {
  const moveLogs = useAtomValue(moveLogsAtom);

  return (
    <>
      <Card>
        <CardContent className="relative p-4">
          <div className="translate-x-20">
            <div className="relative grid grid-cols-2" id="board">
              <div className="absolute z-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PawnButton playerColor="red" index={i} key={i} />
                ))}
              </div>
              <div className="flex">
                <div className="flex flex-col">
                  <InitialHome playerColor="red" />
                  <PawnArea playerColor="red" />
                </div>
                <div className="flex flex-col">
                  <PawnArea playerColor="green" />
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
                </div>
              </div>
              <div className="absolute z-50 right-1/2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PawnButton playerColor="green" index={i} key={i} />
                ))}
              </div>
              <div className="flex flex-col w-fit">
                <div className="flex">
                  <InitialHome playerColor="green" />
                </div>
                <PawnArea playerColor="yellow" />
              </div>
              <div className="absolute z-50 top-[60%]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PawnButton playerColor="blue" index={i} key={i} />
                ))}
              </div>
              <div className="flex">
                <InitialHome playerColor="blue" />
                <PawnArea playerColor="blue" />
              </div>
              <div className="absolute z-50 right-1/2 top-[60%]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PawnButton playerColor="yellow" index={i} key={i} />
                ))}
              </div>
              <div className="flex flex-col w-fit">
                <InitialHome playerColor="yellow" />
              </div>
            </div>
            <DiceView />
          </div>
        </CardContent>
      </Card>
      <div className="absolute h-[80%] overflow-scroll right-3 top-3">
        {moveLogs.map((log, index) => (
          <div key={index} className="mb-2">
            {log}
          </div>
        ))}
      </div>
    </>
  );
}
