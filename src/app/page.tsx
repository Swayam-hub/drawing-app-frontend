"use client";
import { useDraw } from "@/hooks/useDraw";
import { drawLine } from "@/utils/drawLine";
import { FC, useEffect, useState } from "react";
import { ChromePicker } from "react-color";
import { io } from "socket.io-client";
const socket = io("http://localhost:3001");
interface pageProps {}

type DrawLineProps = {
  prevPoint: Point | null;
  currentPoint: Point;
  color: string;
};

const page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>("#000");
  const { canvasRef, onMouseDown, onClear } = useDraw(createLine);

  useEffect(() => {
    const ctx = canvasRef?.current?.getContext("2d");
    socket.emit("client-ready");
    socket.on("get-canvas-state", () => {
      if (!canvasRef?.current?.toDataURL()) return;
      socket.emit("canvas-state", canvasRef.current?.toDataURL());
    });

    socket.on("canvas-state-from-server", (state: string) => {
      console.log("recieved");

      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
    });

    socket.on(
      "draw-line",
      ({ prevPoint, currentPoint, color }: DrawLineProps) => {
        if (!ctx) return;
        drawLine({ prevPoint, currentPoint, ctx, color });
      }
    );
    socket.on("clear", onClear);
    return () => {
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("draw-line");
      socket.off("clear");
    };
  }, [canvasRef]);

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit("draw-line", { prevPoint, currentPoint, color });
    drawLine({ prevPoint, currentPoint, ctx, color });
  }

  return (
    <main className="w-screen h-screen bg-white flex justify-center items-center">
      <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
      <button onClick={() => socket.emit("clear")} className="text-black">
        Clear Canvas
      </button>
      <canvas
        onMouseDown={onMouseDown}
        ref={canvasRef}
        width={750}
        height={750}
        className="border border-black rounded-md"
      />
    </main>
  );
};

export default page;
