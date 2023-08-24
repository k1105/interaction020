import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { updateHandposeHistory } from "../lib/updateHandposeHistory";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { isFront } from "../lib/calculator/isFront";
import { Monitor } from "../components/Monitor";
import Matter from "matter-js";
import { Ball } from "../lib/BallClass";
import { Event } from "../lib/EventClass";
import { Point } from "../lib/PointClass";

type Props = {
  handpose: MutableRefObject<Hand[]>;
};

type Handpose = Keypoint[];

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  let handposeHistory: {
    left: Handpose[];
    right: Handpose[];
  } = { left: [], right: [] };

  const distList: Keypoint[] = new Array(12).fill({ x: 0, y: 0 });
  const debugLog = useRef<{ label: string; value: any }[]>([]);

  // module aliases
  let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;
  const floors: Matter.Body[] = [];
  for (let i = 0; i < 11; i++) {
    floors.push(
      Bodies.rectangle(
        (window.innerWidth / 11) * i + window.innerWidth / 11 / 2,
        (window.innerHeight / 3) * 2,
        1,
        10,
        { isStatic: true }
      )
    );
  }

  const points: Point[] = [];
  for (let i = 0; i < 3; i++) {
    points.push(new Point({ x: window.innerWidth, y: window.innerHeight }, 30));
  }
  let event = new Event("x0.5", 50);
  const balls: Ball[] = [];
  for (let i = 0; i < 1; i++) {
    balls.push(new Ball({ x: window.innerWidth / 2, y: -1000 }, 80));
  }

  const score = useRef<number>(0);
  const bestScore = useRef<number>(0);

  // create an engine
  let engine: Matter.Engine;

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
    engine = Engine.create();
    Composite.add(engine.world, [...balls.map((b) => b.body), ...floors]);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current);
    handposeHistory = updateHandposeHistory(rawHands, handposeHistory); //handposeHistoryの更新
    const hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する

    // logとしてmonitorに表示する
    debugLog.current = [];
    for (const hand of handpose.current) {
      debugLog.current.push({
        label: hand.handedness + " accuracy",
        value: hand.score,
      });
      debugLog.current.push({
        label: hand.handedness + " is front",
        //@ts-ignore
        value: isFront(hand.keypoints, hand.handedness.toLowerCase()),
      });
    }

    p5.clear();

    p5.noStroke();
    //base circle
    p5.circle(0, (p5.height / 3) * 2, 10);
    for (let i = 0; i < 11; i++) {
      p5.circle((i * p5.width) / 11, (p5.height / 3) * 2, 10);
    }
    p5.circle(p5.width, (p5.height / 3) * 2, 10);
    //base circle

    if (hands.left.length > 0) {
      for (let i = 0; i < 5; i++) {
        distList[6 - (i + 1)] = {
          x: hands.left[4 * i + 4].x - hands.left[4 * i + 1].x,
          y: hands.left[4 * i + 4].y - hands.left[4 * i + 1].y,
        };
      }
    }
    if (hands.right.length > 0) {
      for (let i = 0; i < 5; i++) {
        distList[i + 6] = {
          x: hands.right[4 * i + 4].x - hands.right[4 * i + 1].x,
          y: hands.right[4 * i + 4].y - hands.right[4 * i + 1].y,
        };
      }
    }

    for (let i = 1; i < 12; i++) {
      p5.push();
      p5.fill(200);
      p5.translate((i * p5.width) / 11, (p5.height / 3) * 2);
      p5.circle(distList[i].x, distList[i].y, 10);
      p5.stroke(200);
      p5.noFill();
      p5.strokeWeight(2);
      p5.line(0, 0, distList[i].x, distList[i].y);
      p5.pop();
    }

    p5.push();
    p5.noFill();
    p5.stroke(200);
    p5.rectMode(p5.CENTER);
    for (let i = 0; i < 12; i++) {
      if (i < 11) {
        const currentWidth = floors[i].bounds.max.x - floors[i].bounds.min.x;
        const pointWidth = 100;
        Matter.Body.scale(floors[i], pointWidth / currentWidth, 1);
        const dist = p5.dist(
          distList[i + 1].x + p5.width / 11,
          distList[i + 1].y,
          distList[i].x,
          distList[i].y
        );
        const angle = Math.atan2(
          distList[i + 1].y - distList[i].y,
          distList[i + 1].x + p5.width / 11 - distList[i].x
        );
        Matter.Body.setPosition(
          floors[i],
          {
            x:
              (distList[i].x + distList[i + 1].x + p5.width / 11) / 2 +
              (i * p5.width) / 11,
            y: (distList[i].y + distList[i + 1].y) / 2 + (p5.height / 3) * 2,
          }, //@ts-ignore
          true
        );
        Matter.Body.setAngle(
          floors[i],
          angle, //@ts-ignore
          true
        );
        p5.push();
        p5.noFill();
        p5.strokeWeight(1);
        p5.translate(
          (distList[i].x + distList[i + 1].x + p5.width / 11) / 2 +
            (i * p5.width) / 11,
          (distList[i].y + distList[i + 1].y) / 2 + (p5.height / 3) * 2
        );
        p5.rotate(angle);
        p5.rect(0, 0, dist, 10);
        p5.pop();
        // p5.push();
        // p5.noFill();
        // p5.strokeWeight(1);
        // p5.translate(floors[i].position.x, floors[i].position.y);
        // p5.rotate(floors[i].angle);
        // const [w, h] = [
        //   floors[i].bounds.max.x - floors[i].bounds.min.x,
        //   floors[i].bounds.max.y - floors[i].bounds.min.y,
        // ];
        // p5.rect(0, 0, w, h);
        // p5.pop();
      }
    }
    p5.pop();

    for (const ball of balls) {
      const circle = ball.body;
      if (circle.position.y > 2000) {
        Matter.Body.setPosition(circle, { x: window.innerWidth / 2, y: -1000 });
        score.current = 0;
      }

      if (event.getState() == "fired") {
        if (event.type == "x2") {
          Matter.Body.scale(circle, 2, 2);
          ball.setMultiply(2);
          ball.updateScale(2);
        } else if (event.type == "x0.5") {
          Matter.Body.scale(circle, 0.5, 0.5);
          ball.setMultiply(0.5);
          ball.updateScale(0.5);
        }
        event.setNone();
      } else if (event.getState() == "expired") {
        if (event.type == "x2" || event.type == "x0.5") {
          const scale = 1 / ball.getMultiply();
          Matter.Body.scale(circle, scale, scale);
          ball.updateScale(scale);
          ball.setMultiply(1);
        }
        event.setNone();
      }

      event.update(ball);
      bestScore.current = Math.max(score.current, bestScore.current);
    }

    for (const point of points) {
      point.update(balls, score);
    }

    Engine.update(engine);

    /* draw circle */
    for (const ball of balls) {
      ball.show(p5);
    }
    event.show(p5);
    for (const point of points) point.show(p5);

    p5.textSize(20);
    p5.text("Score: " + String(score.current), 100, p5.height - 140);
    p5.text("Best Score: " + String(bestScore.current), 100, p5.height - 100);
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  setInterval(function () {
    if (!event.getIsAlive()) {
      const types = ["x2", "x0.5"];
      const typeId = Math.floor(Math.random() * 2);
      event = new Event(types[typeId], 50);
    }
  }, 30000);

  return (
    <>
      <Monitor handpose={handpose} debugLog={debugLog} />
      {/* <Recorder handpose={handpose} /> */}
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
