import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

const logger = pino({
  level: isTest ? 'warn' : isDev ? 'debug' : 'info',
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' }
        }
      }
    : {})
})

export default logger

// Named child loggers for each domain
export const apiLogger   = logger.child({ module: 'api' })
export const orderLogger = logger.child({ module: 'order' })
export const menuLogger  = logger.child({ module: 'menu' })
export const testLogger  = logger.child({ module: 'test' })
