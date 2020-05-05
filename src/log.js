const { createLogger, format, transports } = require('winston');

const { combine, timestamp, prettyPrint } = format;

class Logger {
  constructor() {
    this.logger = createLogger({
      format: combine(
        timestamp(),
        prettyPrint(),
      ),
      // transports: [],
      transports: [
        // new transports.File({ filename: 'app.log' })
        new transports.Console(),
      ],
      rejectionHandlers: [
        // new transports.File({ filename: 'rejections.log' }),
        new transports.Console(),
      ],
      exceptionHandlers: [
        // new transports.File({ filename: 'exceptions.log' }),
        new transports.Console(),
      ],
    });
    this.logger.rejections.handle(
    );
  }

  debug(log) {
    this.logger.debug(log);
  }

  warn(log) {
    this.logger.warn(log);
  }

  info(log) {
    this.logger.info(log);
  }

  error(log) {
    this.logger.error(log);
  }
}

module.exports = new Logger();
