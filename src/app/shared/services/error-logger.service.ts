import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggerService {

  logError(message: string, error?: any): void {
    console.error(`[ErrorLogger] ${message}`, error ?? '');
  }
}
