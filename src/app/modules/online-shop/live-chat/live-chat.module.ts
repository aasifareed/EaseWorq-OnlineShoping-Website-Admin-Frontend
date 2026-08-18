import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { LiveChatRoutingModule } from './live-chat-routing.module';
import { LiveChatComponent } from './live-chat.component';
import { ChatApiService } from './chat-api.service';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, SharedModule, LiveChatRoutingModule],
  declarations: [LiveChatComponent],
  providers: [ChatApiService],
})
export class LiveChatModule {}
