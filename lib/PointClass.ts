import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Ball } from "./BallClass";
import { MutableRefObject } from "react";
import p5Types from "p5";
import { Target } from "./TargetClass";

export class Point extends Target {
  private range: Keypoint;
  state: "born" | "dead" | "none";
  private t: number;
  constructor(range: Keypoint, size: number) {
    super(
      {
        x: (Math.random() * 0.8 + 0.1) * range.x,
        y: (Math.random() * 0.3 + 0.1) * range.y,
      },
      size
    );
    this.range = range;

    this.t = 1;
    this.state = "none";
  }

  update(balls: Ball[], score: MutableRefObject<number>) {
    for (const ball of balls) {
      if (
        this.state == "none" &&
        this.isHit(
          ball.body.position,
          ball.body.bounds.max.x - ball.body.bounds.min.x
        )
      ) {
        // hit
        score.current += 10;
        this.state = "dead";
        this.t = 0;
        this.effectFire();
      }
    }
  }

  show(p5: p5Types) {
    let scale = 1;
    if (this.t < 1) {
      if (this.state == "dead") {
        scale = 1 - this.t;
      } else {
        scale = this.t;
      }
      this.t += 0.05;
    }
    if (this.t <= 1 && this.state !== "none") {
      if (this.state == "dead") {
        this.position = {
          x: (Math.random() * 0.8 + 0.1) * this.range.x,
          y: (Math.random() * 0.3 + 0.1) * this.range.y,
        };
        this.state = "born";
        this.t = 0;
      } else {
        this.state = "none";
      }
    }
    p5.circle(
      this.position.x,
      this.position.y,
      30 * scale * (Math.sin(Date.now() / 300) * 0.15 + 0.85)
    );
    this.showEffect(p5);
  }
}
