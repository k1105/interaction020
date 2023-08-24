import { Ball } from "./BallClass";
import p5Types from "p5";
import { Target } from "./TargetClass";

export class Event extends Target {
  private expire: number;
  private isAlive: boolean;
  state: "fired" | "expired" | "none";
  type: string;
  constructor(type: string, size: number) {
    super({ x: -size, y: 100 }, size);
    this.expire = 0;
    this.type = type;
    this.state = "none";
    this.isAlive = true;
  }

  getIsAlive() {
    return this.isAlive;
  }

  update(ball: Ball) {
    if (
      this.isAlive &&
      this.isHit(
        ball.body.position,
        ball.body.bounds.max.x - ball.body.bounds.min.x
      ) &&
      ball.getMultiply() == 1
    ) {
      this.effectFire();
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
    this.showEffect(p5);
  }

  getState() {
    return this.state;
  }

  setNone() {
    this.state = "none";
  }
}
