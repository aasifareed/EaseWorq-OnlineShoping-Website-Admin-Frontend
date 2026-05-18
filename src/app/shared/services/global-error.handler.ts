import { ErrorHandler, Injectable } from '@angular/core';
import { ErrorLoggerService } from './error-logger.service';

/**
 * Global Angular error handler. All uncaught errors (e.g. in components, RxJS, promises)
 * are sent to ErrorLoggerService, which in Electron writes to POSMartAppErros/angular-errors.log.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private errorLogger: ErrorLoggerService) {}

  handleError(error: any): void {
    const message = error?.message ?? (typeof error === 'string' ? error : 'Unknown error');
    this.errorLogger.logError(message, error);
    // Keep default console behavior in development
    console.error('GlobalErrorHandler:', error);
  }
}
