import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { powDist } from "./calculator/powDist";
import p5Types from "p5";

export class Target {
  private effectTime: number;
  private effectState: "fired" | "none";
  state: "born" | "aborning" | "alive" | "hit" | "dying" | "dead";
  position: Keypoint;
  private effectPosition: Keypoint;
  size: number;
  constructor(position: Keypoint, size: number) {
    this.position = position;
    this.size = size;
    this.effectTime = 0;
    this.effectState = "none";
    this.effectPosition = position;
    this.state = "born";
  }

  isHit(position: Keypoint, size: number) {
    return powDist(position, this.position) < ((this.size + size) / 2) ** 2;
  }

  effectFire() {
    this.effectState = "fired";
    this.effectPosition = this.position;
  }

  showEffect(p5: p5Types) {
    if (this.effectState == "fired") {
      p5.push();
      p5.noFill();
      p5.stroke(255, 255 - this.effectTime / 3);
      p5.strokeWeight(1);
      p5.circle(this.effectPosition.x, this.effectPosition.y, this.effectTime);
      p5.pop();
      this.effectTime += 10;
      if (this.effectTime / 3 > 255) {
        this.effectTime = 0;
        this.effectState = "none";
      }
    }
  }
}
