# Scalable Twitter Feed System

A production-inspired distributed timeline generation system built to simulate how large-scale social media platforms like Twitter/X serve personalized feeds to millions of users with low latency and high availability.

This project started as a simple backend API and evolved into a scalable distributed architecture featuring:

* Timeline generation
* Fan-out-on-write feed delivery
* Hybrid celebrity feed handling
* Redis caching
* Background workers
* Queue-based async processing
* Monitoring and observability
* Dockerized infrastructure
* Load testing
* Chaos engineering concepts

---

#  Project Goal

The primary objective of this project is to understand and implement the architectural patterns behind large-scale social media feed systems.

The project explores:

* Read-heavy distributed systems
* Feed generation strategies
* Caching patterns
* Event-driven processing
* Scalability bottlenecks
* Resilience engineering
* Observability practices

---

# The Problem

Generating personalized timelines at scale is extremely difficult.

A naive approach would look like this:

1. User opens the app
2. Backend queries tweets from every followed account
3. Merge and sort tweets
4. Return timeline

If a user follows 500 people:

* 500+ queries may be required per request

At large scale:

* Hundreds of thousands of requests per second
* Millions of database reads
* High latency
* Database overload

This project demonstrates how modern systems solve that problem using:

* Redis caching
* Fan-out-on-write
* Async queues
* Background workers
* Hybrid timeline strategies

---

#  Architecture Diagram

![Architecture Diagram](./docs/architecture-diagram.png)

---

#  System Architecture

## High-Level Architecture

```text
Client
   ↓
API Gateway / Express API
   ↓
PostgreSQL ←→ Redis
   ↓
BullMQ Queue
   ↓
Background Worker
   ↓
Redis Timeline Cache

Monitoring:
Prometheus → Grafana
```

---

#   Core Features

##  User Management

* Create users
* Celebrity user support
* User relationships

---

##  Follow System

* Follow other users
* Build social graph
* Timeline relationship mapping

---

## ✅ Tweet Posting

* Post tweets
* Persistent tweet storage
* Timeline propagation

---

## ✅ Timeline Generation

* Personalized feeds
* Chronological sorting
* Fast timeline reads

---

## ✅ Redis Timeline Cache

* Cached timelines
* Reduced database load
* Faster read performance

---

## ✅ Fan-out-on-write

When a user tweets:

1. Tweet stored in PostgreSQL
2. Followers fetched
3. Tweet pushed into followers’ Redis timelines

This dramatically improves read latency.

---

## ✅ Hybrid Celebrity Model

Fan-out-on-write breaks for celebrities.

Example:

* Celebrity with 10M followers
* One tweet = 10M cache writes

Solution:

* Normal users → fan-out-on-write
* Celebrities → fan-out-on-read

Celebrity tweets are dynamically merged into timelines at read time.

---

## ✅ Queue-Based Async Processing

Heavy fan-out operations are processed asynchronously using:

* BullMQ
* Redis-backed queues
* Background workers

Benefits:

* Faster API responses
* Improved scalability
* Better fault isolation

---

## ✅ Monitoring & Observability

Integrated monitoring stack:

* Prometheus
* Grafana

Metrics include:

* Request latency
* Queue throughput
* Worker processing rate
* Error rates
* System health

---

## ✅ Load Testing

Load testing performed using:

* k6

Used to simulate:

* High traffic
* Timeline request bursts
* System bottlenecks

---

## ✅ Chaos Engineering Concepts

Failure simulation experiments include:

* Redis outages
* Database failures
* Worker crashes
* Latency injection

The goal is to understand:

* System resilience
* Graceful degradation
* Recovery patterns

---

#  Tech Stack

## Backend

* Node.js
* Express.js

---

## Database

* PostgreSQL

---

## Cache

* Redis

---

## Queue System

* BullMQ

---

## Monitoring

* Prometheus
* Grafana

---

## Containerization

* Docker
* Docker Compose

---

## Testing

* Thunder Client
* k6

---

# 📂 Project Structure

```text
.
├── index.js
├── worker.js
├── queue.js
├── docker-compose.yml
├── Dockerfile
├── prometheus.yml
├── load-test.js
├── package.json
└── README.md
```

---

#  Database Schema

## Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  is_celebrity BOOLEAN DEFAULT FALSE
);
```

---

## Follows Table

```sql
CREATE TABLE follows (
  follower_id INT,
  followee_id INT
);
```

---

## Tweets Table

```sql
CREATE TABLE tweets (
  id SERIAL PRIMARY KEY,
  user_id INT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#  Timeline Strategies

## 1. Naive Timeline Generation

```text
Request timeline
   ↓
Query tweets from followed users
   ↓
Merge and sort
   ↓
Return response
```

### Problem

* Expensive reads
* High DB pressure
* Poor scalability

---

## 2. Redis Cache Layer

```text
Timeline request
   ↓
Redis lookup
   ↓
Return cached timeline
```

### Benefit

* Lower latency
* Reduced DB reads

---

## 3. Fan-out-on-write

```text
Tweet created
   ↓
Push into followers' timelines
```

### Benefit

* Extremely fast reads

### Trade-off

* Heavy writes

---

## 4. Hybrid Model

```text
Normal users → fan-out-on-write
Celebrities → fan-out-on-read
```

### Benefit

* Prevents massive fan-out explosions

---

#  API Endpoints

## Create User

```http
POST /users
```

### Example Body

```json
{
  "name": "Samuel",
  "isCelebrity": false
}
```

---

## Follow User

```http
POST /follow
```

### Example Body

```json
{
  "followerId": 1,
  "followeeId": 2
}
```

---

## Create Tweet

```http
POST /tweet
```

### Example Body

```json
{
  "userId": 2,
  "content": "Hello world"
}
```

---

## Get Timeline

```http
GET /timeline/:userId
```

---

## Metrics Endpoint

```http
GET /metrics
```

---

## Health Check

```http
GET /health
```

---

#  Running with Docker

## Start Infrastructure

```bash
docker-compose up --build
```

---

## Services

| Service    | Port |
| ---------- | ---- |
| API        | 3000 |
| PostgreSQL | 5432 |
| Redis      | 6379 |
| Prometheus | 9090 |
| Grafana    | 3001 |

---

#  Monitoring

## Prometheus

Collects:

* API metrics
* Queue metrics
* Worker metrics

---

## Grafana

Visualizes:

* Request latency
* Queue depth
* Error rate
* Timeline performance

---

#  Load Testing

## Run k6 Test

```bash
k6 run load-test.js
```

This simulates:

* Concurrent users
* Timeline traffic
* Read-heavy load

---

#  Chaos Testing Concepts

Experiments performed:

* Redis shutdown
* PostgreSQL outage
* Worker crashes
* Artificial latency

Goals:

* Observe resilience
* Validate fallback behavior
* Understand failure recovery

---

#  Scalability Concepts Demonstrated

This project demonstrates:

* Distributed system design
* Read-heavy optimization
* Async event processing
* Queue-based architectures
* Cache strategies
* Feed generation patterns
* Observability
* Infrastructure monitoring

---

#  Learning Outcomes

Through this project, the following concepts were explored deeply:

* Timeline generation at scale
* Redis caching strategies
* Fan-out-on-write
* Hybrid timeline architecture
* Async background processing
* Distributed systems thinking
* Observability engineering
* Performance testing
* Resilience engineering

---

#  Future Improvements

Potential upgrades:

* Kubernetes deployment
* CI/CD pipelines
* Auto-scaling workers
* Rate limiting
* JWT authentication
* Timeline ranking algorithm
* Distributed Redis cluster
* Multi-region deployment
* Circuit breaker patterns
* Service mesh integration

---

#  Author

Samuel Happiness

Software Engineer | Cloud & DevOps Enthusiast | Distributed Systems Learner

---

#  Final Note

This project was built primarily as a deep hands-on learning experience focused on:

* System design
* Scalability engineering
* DevOps practices
* Distributed architecture

The goal was not just to build features, but to understand how modern systems behave under scale, failure, and heavy traffic.
