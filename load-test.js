import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 20, // virtual users
  duration: '30s',
};

export default function () {
  http.get('http://localhost:3000/timeline/1');
  sleep(1);
}