import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Ball } from "./BallClass";
import { powDist } from "./calculator/powDist";
import p5Types from "p5";

export class Event {
  private expire: number;
  private size: number;
  private position: Keypoint;
  private isAlive: boolean;
  state: "fired" | "expired" | "none";
  type: string;
  constructor(type: string) {
    this.expire = 0;
    this.size = 30;
    this.type = type;
    this.position = { x: -this.size, y: 100 };
    this.state = "none";
    this.isAlive = true;
  }
  update(ball: Ball) {
    if (
      this.isAlive &&
      powDist(ball.body.position, this.position) <
        ((this.size + ball.body.bounds.max.x - ball.body.bounds.min.x) / 2) ** 2
    ) {
      this.fire();
    }

    if (this.expire > 0 && Date.now() > this.expire) {
      this.state = "expired";
      this.expire = 0;
    }

    if (this.isAlive) {
      this.position.x += 0.5;
      if (this.position.x > window.innerWidth + this.size) {
        //画面外にイベントがはみ出したときに死滅する
        this.isAlive = false;
      }
    }
  }
  private fire() {
    this.state = "fired";
    this.expire = Date.now() + 10000;
    this.isAlive = false;
    this.position.x = -this.size; //reset to initial position
  }

  show(p5: p5Types) {
    if (this.isAlive) {
      p5.push();
      p5.noFill();
      p5.stroke(255);
      p5.strokeWeight(1);
      p5.circle(this.position.x, this.position.y, this.size);
      p5.textAlign(p5.CENTER);
      p5.textSize(10);
      p5.fill(255);
      p5.noStroke();
      p5.text(
        this.type,
        this.position.x,
        this.position.y + (p5.textAscent() - p5.textDescent()) / 2
      );
      p5.pop();
    }
  }

  getState() {
    return this.state;
  }

  setNone() {
    this.state = "none";
  }
}
