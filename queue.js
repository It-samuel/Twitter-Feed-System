const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// 🔌 Add the 'redis' hostname here
const connection = new IORedis({
  host: 'redis',
  port: 6379,
  maxRetriesPerRequest: null // BullMQ requires this for IORedis
});

const tweetQueue = new Queue('tweetQueue', { connection });

module.exports = tweetQueue;