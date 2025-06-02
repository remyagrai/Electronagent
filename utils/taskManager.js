export class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentTask = null;
    this.startTime = null;
  }

  startTask(name) {
    if (this.currentTask) {
      this.stopTask();
    }
    this.currentTask = { name, duration: 0 };
    this.startTime = Date.now();
  }

  stopTask() {
    if (!this.currentTask) return;
    const duration = Math.floor((Date.now() - this.startTime) / 1000 / 60); // minutes
    this.currentTask.duration += duration;
    this.tasks.push(this.currentTask);
    this.currentTask = null;
  }
}
