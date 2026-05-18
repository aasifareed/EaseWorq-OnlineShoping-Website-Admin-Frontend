import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ShippingEditingState {
  id: string | null;
  name: string;
}

@Injectable()
export class ShippingStateService {
  private readonly state$ = new BehaviorSubject<ShippingEditingState>({
    id: null,
    name: '',
  });

  private readonly openRulesTabSource = new Subject<ShippingEditingState>();

  readonly editing$ = this.state$.asObservable();
  readonly openRulesTab$ = this.openRulesTabSource.asObservable();

  setEditing(id: string, name: string): void {
    this.state$.next({ id, name });
  }

  openRulesTab(id: string, name: string): void {
    const state = { id, name };
    this.state$.next(state);
    this.openRulesTabSource.next(state);
  }

  clear(): void {
    this.state$.next({ id: null, name: '' });
  }

  get current(): ShippingEditingState {
    return this.state$.value;
  }
}
