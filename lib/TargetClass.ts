import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { powDist } from "./calculator/powDist";

export class Target {
  position: Keypoint;
  size: number;
  constructor(position: Keypoint, size: number) {
    this.position = position;
    this.size = size;
  }

  isHit(position: Keypoint, size: number) {
    return powDist(position, this.position) < ((this.size + size) / 2) ** 2;
  }
}
