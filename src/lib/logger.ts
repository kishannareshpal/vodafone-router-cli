import winston, { Logger as WinstonLogger } from 'winston';

export type Logger = WinstonLogger;

/**
 * Creates a new application logger.
 *
 * @param label - A label that helps differentiate different loggers. E.g., use the name of the service file or method.
 * @returns A new logger instance.
 */
export const makeLogger = (label: string): Logger => {
  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.cli(),
          winston.format.colorize(),
          winston.format.label({ label: label }),
          winston.format.printf(({ level, message, label }) => {
            return `[${label}] ${level}: ${message}`;
          })
        )
      })
    ]
  })
}


export const makeCommandLogger = (): Logger => {
  return winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ message }) => {
            return `${message}`;
          })
        )
      })
    ]
  })
}