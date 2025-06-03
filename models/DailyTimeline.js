const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: String,
  duration: Number
});

const activitySchema = new mongoose.Schema({
  start: String,
  end: String,
  status: String
});

const browserSchema = new mongoose.Schema({
  domain: String,
  start: String,
  end: String
});

const dailyTimelineSchema = new mongoose.Schema({
  userId: String,
  email: String,
  date: String,
  tasks: [taskSchema],
  activity: [activitySchema],
  browser: [browserSchema]
});

module.exports = mongoose.model('DailyTimeline', dailyTimelineSchema);
