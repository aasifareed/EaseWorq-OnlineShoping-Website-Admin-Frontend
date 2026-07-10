import { Component } from '@angular/core';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-store-not-found',
  templateUrl: './store-not-found.component.html',
  styleUrls: ['./store-not-found.component.scss'],
})
export class StoreNotFoundComponent {
  constructor(private userService: UserService) {}

  signOut(): void {
    this.userService.signout();
  }
}
