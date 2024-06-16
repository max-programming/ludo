import { InitialHome } from "./InitialHome";
import { PawnArea } from "./PawnArea";
import { PawnButton } from "./Pawns";
import { DiceView } from "./DiceView";
import { FinalHome } from "./FinalHome";
// import { useAtomValue } from "jotai";
// import { moveLogsAtom } from "@/utils/atoms";

export function Board() {
  // const moveLogs = useAtomValue(moveLogsAtom);

  return (
    <>
      <div className="relative flex items-center h-full">
        <DiceView />
        <div className="relative" id="board">
          <div className="absolute z-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <PawnButton playerColor="red" index={i} key={i} />
            ))}
          </div>
          <div className="absolute z-50 right-[40%]">
            {Array.from({ length: 4 }).map((_, i) => (
              <PawnButton playerColor="green" index={i} key={i} />
            ))}
          </div>
          <div className="absolute z-50 top-[60%]">
            {Array.from({ length: 4 }).map((_, i) => (
              <PawnButton playerColor="blue" index={i} key={i} />
            ))}
          </div>
          <div className="absolute z-50 right-[40%] top-[60%]">
            {Array.from({ length: 4 }).map((_, i) => (
              <PawnButton playerColor="yellow" index={i} key={i} />
            ))}
          </div>
          <div className="flex">
            <div className="flex">
              <div className="flex flex-col">
                <InitialHome playerColor="red" />
                <PawnArea playerColor="red" />
              </div>
              <div className="flex flex-col">
                <PawnArea playerColor="green" />
                <FinalHome />
              </div>
            </div>
            <div className="flex flex-col w-fit">
              <div className="flex">
                <InitialHome playerColor="green" />
              </div>
              <PawnArea playerColor="yellow" />
            </div>
          </div>
          <div className="flex">
            <div className="flex">
              <InitialHome playerColor="blue" />
              <PawnArea playerColor="blue" />
            </div>
            <div className="flex flex-col w-fit">
              <InitialHome playerColor="yellow" />
            </div>
          </div>
        </div>
      </div>

      {/* {import.meta.env.DEV && (
        <div className="absolute h-[80%] overflow-scroll right-3 top-3">
          {moveLogs.map((log, index) => (
            <div key={index} className="mb-2">
              {log}
            </div>
          ))}
        </div>
      )} */}
    </>
  );
}
