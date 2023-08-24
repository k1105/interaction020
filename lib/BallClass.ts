import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import Matter from "matter-js";
import p5Types from "p5";

export class Ball {
  body: Matter.Body;
  private displaySize: number;
  private t: number;
  private scale: number;
  private targetScale: number;
  constructor(position: Keypoint, size: number) {
    this.body = Matter.Bodies.circle(position.x, position.y, size);
    this.displaySize = size * 2;
    this.scale = 1;
    this.targetScale = 1;
    this.t = 1;
  }

  show(p5: p5Types) {
    if (this.t < 1) {
      this.scale = 1 - this.t + this.t * this.targetScale;
    }
    p5.circle(
      this.body.position.x,
      this.body.position.y,
      this.displaySize * this.scale
    );
    this.t += 0.1;
  }

  updateScale(scale: number) {
    this.targetScale = scale;
    this.t = 0;
  }
}
