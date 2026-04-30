const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { Pool } = require('pg');

const connection = new IORedis({
  host: 'redis',
  port: 6379,
  maxRetriesPerRequest: null,
});

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'yourdatabase',
  password: 'yourpassword',
  port: 5432,
});

const worker = new Worker(
  'tweetQueue',
  async job => {
    const { userId, tweet } = job.data;

    // Check if celebrity
    const userResult = await pool.query(
      'SELECT is_celebrity FROM users WHERE id = $1',
      [userId]
    );

    const isCelebrity = userResult.rows[0].is_celebrity;

    if (isCelebrity) return;

    // Get followers
    const followersResult = await pool.query(
      'SELECT follower_id FROM follows WHERE followee_id = $1',
      [userId]
    );

    const followers = followersResult.rows;

    // Fan-out
    for (let follower of followers) {
      await connection.lpush(
        `timeline:${follower.follower_id}`,
        JSON.stringify(tweet)
      );
    }

    console.log(`Processed fan-out for tweet ${tweet.id}`);
  },
  { connection }
);