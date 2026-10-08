import { createApp } from './app';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const server = createApp().listen(port, () => {
  console.info(`IncidentHub API listening on port ${port}`);
});

function shutdown(): void {
  server.close((error) => {
    if (error) {
      console.error('Error while closing IncidentHub API:', error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
