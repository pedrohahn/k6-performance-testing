import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Métricas
export const getMessage = new Trend('get_message_duration', true);
export const getMessageFailed = new Rate('get_message_failed_rate');

// Configurações de carga
export const options = {
  stages: [
    { duration: '1m', target: 20 }, // Gradual aumento inicial
    { duration: '1m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '1m', target: 250 },
    { duration: '1m', target: 300 } // Pico de 300 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.12'], // Menos de 12% de erros
    http_req_duration: ['p(95)<5700'] // 95% das requisições abaixo de 5700ms
  }
};

// Geração de relatório
export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Teste principal
export default function () {
  const baseUrl = 'https://api.kanye.rest';

  const res = http.get(baseUrl);

  // Registrar duração da requisição
  getMessage.add(res.timings.duration);

  // Registrar taxa de falha com base no status
  getMessageFailed.add(res.status !== 200);

  // Verificar se a resposta está correta
  check(res, {
    'get message - status 200': r => r.status === 200
  });
}
