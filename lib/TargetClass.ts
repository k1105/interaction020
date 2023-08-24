import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Ball } from "./BallClass";
import { MutableRefObject } from "react";
import { powDist } from "./calculator/powDist";
import p5Types from "p5";

export class Target {
  private range: Keypoint;
  private position: Keypoint;
  size: number;
  state: "born" | "death" | "none";
  private t: number;
  constructor(range: Keypoint, size: number) {
    this.range = range;
    this.position = {
      x: (Math.random() * 0.8 + 0.1) * range.x,
      y: (Math.random() * 0.3 + 0.1) * range.y,
    };
    this.size = size;
    this.t = 1;
    this.state = "none";
  }

  update(ball: Ball, score: MutableRefObject<number>) {
    if (
      this.state == "none" &&
      powDist(ball.body.position, this.position) <
        ((this.size + ball.body.bounds.max.x - ball.body.bounds.min.x) / 2) ** 2
    ) {
      // hit
      score.current += 10;
      this.state = "death";
      this.t = 0;
    }
  }

  show(p5: p5Types) {
    let scale = 1;
    if (this.t < 1) {
      if (this.state == "death") {
        scale = 1 - this.t;
      } else {
        scale = this.t;
      }
      this.t += 0.05;
    }
    if (this.t <= 1 && this.state !== "none") {
      if (this.state == "death") {
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
  }
}
