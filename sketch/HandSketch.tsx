import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { updateHandposeHistory } from "../lib/updateHandposeHistory";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { Monitor } from "../components/Monitor";
import Matter from "matter-js";
import { Ball } from "../lib/BallClass";
import { Event } from "../lib/EventClass";
import { Point } from "../lib/PointClass";
import { Opacity } from "../lib/OpacityClass";
import { Effect } from "../lib/EffectClass";
import * as Tone from "tone";
import { ScoreMonitor } from "../components/ScoreMonitor";
import { randomSort } from "../lib/calculator/randomSort";

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

  const debugLog = useRef<{ label: string; value: any }[]>([]);
  const gainRef = useRef<number>(1);
  let lato: p5Types.Font;

  const randomList = useRef<number[]>([4, 3, 2, 1, 0]);
  const fingerName = ["thumb", "index", "middle", "ring", " pinky"];
  const floorWidth = window.innerWidth * 0.9;
  const floorOffset = (window.innerWidth - floorWidth) / 2;

  const posList: Keypoint[] = new Array(12).fill({ x: 0, y: 0 });

  // module aliases
  let Engine = Matter.Engine,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Composites = Matter.Composites;
  const floors: Matter.Body[] = [];

  const comp = Composite.create();

  const player = new Tone.Player(
    "https://k1105.github.io/sound_effect/audio/wood_attack.m4a"
  ).toDestination();
  for (let i = 0; i < 11; i++) {
    // foors
    floors.push(
      Bodies.rectangle(
        (floorWidth / 11) * i + floorWidth / 11 / 2 + floorOffset,
        window.innerHeight - 50,
        floorWidth / 11,
        100,
        //@ts-ignore
        { chamfer: 0, isStatic: true }
      )
    );
    Composite.add(comp, floors[i]);
  }

  const chain = Composites.chain(comp, 0, 0, 0, 0, {});

  // const bucket: Matter.Body[] = [];

  // bucket.push(Bodies.rectangle(300, 350, 10, 100, { isStatic: true }));
  // bucket.push(Bodies.rectangle(450, 400, 300, 10, { isStatic: true }));
  // bucket.push(Bodies.rectangle(600, 350, 10, 100, { isStatic: true }));

  const points: Point[] = [];
  for (let i = 0; i < 3; i++) {
    points.push(
      new Point({
        position: {
          x: window.innerWidth * (Math.random() * 0.8 + 0.1),
          y: window.innerHeight * (Math.random() * 0.3 + 0.1),
        },
        size: 30,
      })
    );
  }
  const events = [new Event("+1", 50)];
  const balls: Ball[] = [];
  for (let i = 0; i < 1; i++) {
    balls.push(new Ball({ x: window.innerWidth / 2, y: -1000 }, 80));
  }

  const effectList: Effect[] = [];

  const opacity = new Opacity();

  const score = useRef<number>(0);
  const bestScore = useRef<number>(0);
  const displayScore = useRef<number>(0);
  const displayBestScore = useRef<number>(0);

  // create an engine
  let engine: Matter.Engine;

  const preload = (p5: p5Types) => {
    lato = p5.loadFont(
      "https://k1105.github.io/sound_effect/font/Lato/Lato-Bold.ttf"
    );
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
    p5.strokeCap(p5.SQUARE);
    engine = Engine.create();
    Composite.add(engine.world, [
      ...balls.map((b) => b.body),
      ...floors,
      // ...bucket,
    ]);
    p5.textFont(lato);
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
        value: Math.floor(hand.score * 100) / 100,
      });
    }

    p5.clear();
    p5.background(255, opacity.value);

    p5.noStroke();

    if (hands.left.length > 0) {
      for (let i = 0; i < 5; i++) {
        const j = randomList.current[i];
        posList[i + 1] = {
          x:
            (hands.left[4 * j + 4].x - hands.left[4 * j + 1].x) *
            gainRef.current,
          y:
            (hands.left[4 * j + 4].y - hands.left[4 * j + 1].y) *
            gainRef.current,
        };
      }
    }
    if (hands.right.length > 0) {
      for (let i = 0; i < 5; i++) {
        const j = randomList.current[i];
        posList[10 - i] = {
          x:
            (hands.right[4 * j + 4].x - hands.right[4 * j + 1].x) *
            gainRef.current,
          y:
            (hands.right[4 * j + 4].y - hands.right[4 * j + 1].y) *
            gainRef.current,
        };
      }
    }

    p5.push();
    p5.noFill();
    p5.stroke(200);
    p5.rectMode(p5.CENTER);
    for (let i = 0; i < 12; i++) {
      p5.push();
      p5.noStroke();
      p5.fill(255);
      p5.translate((i * floorWidth) / 11 + floorOffset, (p5.height / 3) * 2);
      p5.circle(0, 0, 10);
      p5.circle(posList[i].x, posList[i].y, 10);
      p5.stroke(255);
      p5.noFill();
      p5.strokeWeight(2);
      p5.line(0, 0, posList[i].x, posList[i].y);
      p5.pop();
      if (i < 11) {
        // const currentWidth = floors[i].bounds.max.x - floors[i].bounds.min.x;
        // const pointWidth = 100;
        const dist = p5.dist(
          posList[i + 1].x + floorWidth / 11,
          posList[i + 1].y,
          posList[i].x,
          posList[i].y
        );

        const angle = Math.atan2(
          posList[i + 1].y - posList[i].y,
          posList[i + 1].x + floorWidth / 11 - posList[i].x
        );

        Matter.Body.setVertices(floors[i], [
          { x: posList[i].x, y: posList[i].y },
          { x: posList[i + 1].x + floorWidth / 11, y: posList[i + 1].y },
          { x: posList[i + 1].x + floorWidth / 11, y: posList[i + 1].y + 10 },
          { x: posList[i].x, y: posList[i].y + 10 },
        ]);
        Matter.Body.setPosition(
          floors[i],
          {
            x:
              (posList[i].x + posList[i + 1].x + floorWidth / 11) / 2 +
              (i * floorWidth) / 11 +
              floorOffset,
            y: (posList[i].y + posList[i + 1].y) / 2 + (p5.height / 3) * 2,
          }, //@ts-ignore
          true
        );
        p5.push();
        p5.fill(255);
        p5.noStroke();
        p5.translate(
          (posList[i].x + posList[i + 1].x + floorWidth / 11) / 2 +
            (i * floorWidth) / 11 +
            floorOffset,
          (posList[i].y + posList[i + 1].y) / 2 + (p5.height / 3) * 2
        );

        // p5.push();
        // p5.noStroke();
        // p5.fill(220);
        // p5.translate(0, -p5.height / 3);
        // if (i > 5) {
        //   p5.text(fingerName[randomList[i]], 0, 0);
        // } else {
        //   p5.text(fingerName[randomList[9 - i]], 0, 0);
        // }
        // p5.pop();
        p5.rotate(angle);
        p5.rect(0, 0, dist, 10);
        p5.pop();
      }
    }
    p5.pop();

    for (const ball of balls) {
      const circle = ball.body;
      if (
        circle.position.y > p5.height + 200 ||
        circle.position.x > p5.width + 200 ||
        circle.position.x < -200
      ) {
        Composite.remove(engine.world, ball.body);
        const target = balls.indexOf(ball);
        balls.splice(target, 1);
      }

      for (const event of events) {
        if (event.state == "born") event.state = "alive";
        event.update(ball);

        if (event.state == "hit") {
          effectList.push(new Effect(event.position));
          if (event.type == "x2") {
            Matter.Body.scale(circle, 2, 2);
            ball.setMultiply(2);
            ball.updateScale(2);
          } else if (event.type == "x0.5") {
            Matter.Body.scale(circle, 0.5, 0.5);
            ball.setMultiply(0.5);
            ball.updateScale(0.5);
          } else if (event.type == "+1") {
            const newBall = new Ball(
              { x: window.innerWidth / 2, y: -1000 },
              80
            );
            balls.push(newBall);
            Composite.add(engine.world, newBall.body);
          }
          event.state = "dead";
        }

        if (event.isExpired()) {
          if (event.type == "x2" || event.type == "x0.5") {
            for (const targetBall of balls) {
              const scale = 1 / targetBall.getMultiply();
              if (scale !== 1) {
                Matter.Body.scale(targetBall.body, scale, scale);
                targetBall.updateScale(scale);
                targetBall.setMultiply(1);
                break;
              }
            }
          }
          const target = events.indexOf(event);
          events.splice(target, 1);
        }
      }

      bestScore.current = Math.max(score.current, bestScore.current);
    }

    if (balls.length == 0) {
      const newBall = new Ball({ x: window.innerWidth / 2, y: -1000 }, 80);
      balls.push(newBall);
      Composite.add(engine.world, newBall.body);
      score.current = 0;
      opacity.pulse();
    }

    Engine.update(engine);

    // p5.rect(300, 300, 10, 100);
    // p5.rect(300, 390, 300, 10);
    // p5.rect(600, 300, 10, 100);

    // 長方形の描画
    // for (let i = 0; i < floors.length; i++) {
    //   p5.push();
    //   p5.noFill();
    //   p5.stroke(255, 0, 0);
    //   p5.strokeWeight(1);
    //   p5.beginShape();
    //   for (let j = 0; j < 4; j++)
    //     p5.vertex(floors[i].vertices[j].x, floors[i].vertices[j].y);
    //   p5.endShape(p5.CLOSE);
    //   p5.pop();
    // }

    for (const point of points) {
      point.update(balls, score);
      if (point.state == "hit") {
        //play a middle 'C' for the duration of an 8th note
        Tone.loaded().then(() => {
          player.start();
        });
        effectList.push(new Effect(point.position));
        point.state = "dying";
      }
      if (point.state == "dead") {
        const target = points.indexOf(point);
        points.splice(target, 1);
      }
    }

    for (const effect of effectList) {
      effect.update();
      effect.show(p5);
      if (effect.state == "dead") {
        const target = effectList.indexOf(effect);
        effectList.splice(target, 1);
      }
    }

    if (points.length == 0) {
      setTimeout(function () {
        while (points.length < 3) {
          points.push(
            new Point({
              position: {
                x: window.innerWidth * (Math.random() * 0.8 + 0.1),
                y: window.innerHeight * (Math.random() * 0.3 + 0.1),
              },
              size: 30,
            })
          );
        }
      }, 1000);
    }

    opacity.update();

    /* draw circle */
    for (const ball of balls) {
      ball.show(p5);
    }
    for (const event of events) event.show(p5);
    for (const point of points) point.show(p5);

    /*Score */

    if (displayScore.current !== score.current) {
      if (score.current > displayScore.current) {
        displayScore.current = Math.min(
          displayScore.current + 1,
          score.current
        );
      } else {
        displayScore.current = Math.max(
          displayScore.current - 1,
          score.current
        );
      }
    }
    displayBestScore.current = Math.max(
      displayScore.current,
      displayBestScore.current
    );

    p5.translate(0, p5.height - 200);
    ScoreMonitor({
      score: displayScore.current,
      bestScore: displayBestScore.current,
      p5,
    });

    /* Score */
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  addEventListener("keydown", (event) => {
    if (event.code == "KeyR") {
      randomList.current = randomSort(randomList.current);
    }
  });

  setInterval(function () {
    if (events.length == 0) {
      const types = ["x2", "+1", "x0.5"];
      const typeId = Math.floor(Math.random() * 3);
      events.push(new Event(types[typeId], 50));
    }
  }, 30000);

  return (
    <>
      <Monitor handpose={handpose} debugLog={debugLog} gain={gainRef} />
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
