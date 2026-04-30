const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const client = require('prom-client');

// collect default system metrics
client.collectDefaultMetrics();

// custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });

  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Connect to PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'yourdatabase',
  password: 'yourpassword',
  port: 5432,
});


const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://redis:6379' 
});

redisClient.on('error', (err) => console.log('Redis Error', err));

(async () => {
  await redisClient.connect();
})();

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection error');
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});


app.post('/users', async (req, res) => {
  try {
    const { name, isCelebrity } = req.body;

    const result = await pool.query(
      'INSERT INTO users (name, is_celebrity) VALUES ($1, $2) RETURNING *',
      [name, isCelebrity || false]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});


app.post('/follow', async (req, res) => {
  try {
    const { followerId, followeeId } = req.body;

    await pool.query(
      'INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2)',
      [followerId, followeeId]
    );

    res.send('Followed successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error following user');
  }
});


const tweetQueue = require('./queue');

app.post('/tweet', async (req, res) => {
  try {
    const { userId, content } = req.body;

    const result = await pool.query(
      'INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );

    const tweet = result.rows[0];

    // Send job to queue instead of doing work here
    await tweetQueue.add('fanout', {
      userId,
      tweet
    });

    res.json(tweet);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating tweet');
  }
});


app.get('/timeline/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Get cached timeline
    const cached = await redisClient.lRange(`timeline:${userId}`, 0, -1);
    let timeline = cached.map(item => JSON.parse(item));

    // 2. Find celebrities user follows
    const celebResult = await pool.query(`
      SELECT u.id FROM users u
      JOIN follows f ON u.id = f.followee_id
      WHERE f.follower_id = $1 AND u.is_celebrity = true
    `, [userId]);

    const celebIds = celebResult.rows.map(row => row.id);

    if (celebIds.length > 0) {
      const celebTweets = await pool.query(
        `SELECT * FROM tweets 
         WHERE user_id = ANY($1)
         ORDER BY created_at DESC`,
        [celebIds]
      );

      timeline = [...timeline, ...celebTweets.rows];
    }

    // 3. Sort everything
    timeline.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(timeline);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching timeline');
  }
});